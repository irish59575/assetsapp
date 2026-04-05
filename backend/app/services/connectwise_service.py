"""
ConnectWise integration: generate a deployment summary PDF and email it to the CW mailbox
via Microsoft Graph API (app-only / client credentials flow).

Subject: Ticket#<number> causes ConnectWise to attach the email to the existing ticket.
"""
import base64
from datetime import datetime, timezone

import httpx
from fpdf import FPDF

from app.core.config import settings


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

STEP_STATUS_LABEL = {
    "done": "Done",
    "skipped": "Skipped",
    "na": "N/A",
    "pending": "Pending",
}


def _safe(text) -> str:
    """Replace characters outside latin-1 so fpdf2 doesn't error."""
    if not text:
        return ""
    return str(text).encode("latin-1", errors="replace").decode("latin-1")


def _status_str(status) -> str:
    return (status.value if hasattr(status, "value") else status)


def generate_deployment_pdf(deployment) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    # --- Header ---
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 8, _safe(deployment.template_name), ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, _safe(deployment.client_name), ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(4)

    # --- Summary ---
    done_statuses = {"done", "skipped", "na"}
    done_count = sum(
        1 for s in deployment.steps
        if _status_str(s.status) in done_statuses
    )
    fields = [
        ("Engineer",        deployment.engineer_name),
        ("Date Started",    datetime.fromisoformat(str(deployment.started_at)).strftime("%d/%m/%Y") if deployment.started_at else ""),
        ("Status",          _status_str(deployment.status).replace("_", " ").title()),
        ("CW Ticket",       f"#{deployment.connectwise_ticket}" if deployment.connectwise_ticket else ""),
        ("Device Name",     deployment.device_name or ""),
        ("Serial Number",   deployment.serial_number or ""),
        ("Asset Label",     deployment.label_code or ""),
        ("Steps Completed", f"{done_count} / {len(deployment.steps)}"),
    ]
    col_w = 85
    row = 0
    for label, value in fields:
        if not value:
            continue
        x = 20 if row % 2 == 0 else 20 + col_w
        if row % 2 == 0 and row > 0:
            pdf.ln(5)
        pdf.set_x(x)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(30, 5, _safe(label) + ":", ln=False)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(col_w - 32, 5, _safe(value), ln=(row % 2 == 1))
        row += 1
    pdf.ln(6)

    # --- Notes ---
    if deployment.notes:
        pdf.set_fill_color(245, 245, 245)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 5, "Notes", ln=True, fill=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 5, _safe(deployment.notes))
        pdf.ln(3)

    # --- Checklist ---
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Checklist Steps", ln=True)
    pdf.ln(1)

    for i, step in enumerate(deployment.steps):
        status = _status_str(step.status)
        label = STEP_STATUS_LABEL.get(status, status)

        if status == "done":
            pdf.set_text_color(22, 101, 52)
        elif status == "skipped":
            pdf.set_text_color(133, 77, 14)
        elif status == "na":
            pdf.set_text_color(107, 114, 128)
        else:
            pdf.set_text_color(30, 30, 30)

        pdf.set_font("Helvetica", "B", 9)
        title = _safe(f"{i + 1}.  {step.title}")
        if not step.required:
            title += " (optional)"
        pdf.cell(0, 6, title, ln=False)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(0, 6, label, ln=True, align="R")
        pdf.set_text_color(0, 0, 0)

        if step.notes:
            pdf.set_x(28)
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(80, 80, 80)
            pdf.multi_cell(0, 4, _safe(f"Note: {step.notes}"))
            pdf.set_text_color(0, 0, 0)

        if step.completed_at:
            pdf.set_x(28)
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(150, 150, 150)
            ts = datetime.fromisoformat(str(step.completed_at)).strftime("%d/%m/%Y %H:%M")
            by = f" · {step.completed_by}" if step.completed_by else ""
            pdf.cell(0, 4, _safe(f"{ts}{by}"), ln=True)
            pdf.set_text_color(0, 0, 0)

        pdf.ln(1)

    # --- Signature ---
    pdf.ln(6)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(20, pdf.get_y(), 100, pdf.get_y())
    pdf.line(110, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(90, 4, _safe(f"Engineer: {deployment.engineer_name}"), ln=False)
    completed = deployment.completed_at or datetime.now(timezone.utc)
    pdf.cell(0, 4, datetime.fromisoformat(str(completed)).strftime("%d/%m/%Y"), ln=True)
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(0, 4, "Generated by AssetTracker · MSP Asset Management", align="C", ln=True)

    return bytes(pdf.output())


# ---------------------------------------------------------------------------
# Microsoft Graph API — send email
# ---------------------------------------------------------------------------

class ConnectWiseError(Exception):
    pass


def _graph_configured() -> bool:
    return all([
        settings.AZURE_TENANT_ID,
        settings.AZURE_CLIENT_ID,
        settings.AZURE_CLIENT_SECRET,
        settings.GRAPH_SENDER_EMAIL,
    ])


def _get_graph_token() -> str:
    """Obtain an app-only access token via client credentials flow."""
    url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token"
    resp = httpx.post(url, data={
        "grant_type": "client_credentials",
        "client_id": settings.AZURE_CLIENT_ID,
        "client_secret": settings.AZURE_CLIENT_SECRET,
        "scope": "https://graph.microsoft.com/.default",
    })
    if resp.status_code != 200:
        raise ConnectWiseError(f"Failed to get Graph token: {resp.status_code} {resp.text}")
    return resp.json()["access_token"]


def send_deployment_to_connectwise(deployment) -> dict:
    """
    Generate a PDF and send it via Microsoft Graph (sendMail) to the CW mailbox.
    Subject Ticket#<number> causes CW to attach the message to the existing ticket.
    """
    if not _graph_configured():
        raise ConnectWiseError(
            "Microsoft Graph is not configured. "
            "Set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, "
            "GRAPH_SENDER_EMAIL in .env"
        )

    ticket_number = deployment.connectwise_ticket
    if not ticket_number:
        raise ConnectWiseError("This deployment has no ConnectWise ticket number set.")

    pdf_bytes = generate_deployment_pdf(deployment)
    filename = f"deployment_{deployment.id}_{(deployment.template_name or 'summary').replace(' ', '_')}.pdf"
    pdf_b64 = base64.b64encode(pdf_bytes).decode()

    subject = f"Ticket#{ticket_number}"
    body_text = (
        f"Please find attached the deployment summary for:\n\n"
        f"  Template : {deployment.template_name}\n"
        f"  Client   : {deployment.client_name}\n"
        f"  Engineer : {deployment.engineer_name}\n"
        f"  Ticket   : #{ticket_number}\n"
        f"  Status   : {_status_str(deployment.status).replace('_', ' ').title()}\n\n"
        f"Generated by AssetTracker."
    )

    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body_text},
            "toRecipients": [{"emailAddress": {"address": settings.CW_EMAIL}}],
            "attachments": [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": filename,
                    "contentType": "application/pdf",
                    "contentBytes": pdf_b64,
                }
            ],
        },
        "saveToSentItems": "true",
    }

    token = _get_graph_token()
    url = f"https://graph.microsoft.com/v1.0/users/{settings.GRAPH_SENDER_EMAIL}/sendMail"
    resp = httpx.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )

    if resp.status_code not in (200, 202):
        raise ConnectWiseError(f"Graph sendMail failed: {resp.status_code} {resp.text}")

    return {"to": settings.CW_EMAIL, "subject": subject, "filename": filename}
