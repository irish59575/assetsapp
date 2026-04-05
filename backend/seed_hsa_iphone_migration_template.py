"""
Seed script: Creates the HSA iPhone Migration Clinic checklist template.

Usage (from the backend/ directory):
    python seed_hsa_iphone_migration_template.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.client import Client
from app.models.checklist_template import ChecklistTemplate, TemplateStep


TEMPLATE_NAME = "HSA - iPhone Migration Clinic"
TEMPLATE_DESC = "Engineer checklist for iPhone migration clinic — pre-appointment, device intake, supervised device setup, user setup, completion and post-clinic."

STEPS = [
    {
        "title": "Pre-Appointment",
        "description": (
            "• Booking confirmed in MS Bookings.\n"
            "• User attendance confirmed via Teams (day before).\n"
            "• User confirmed Apple ID + password.\n"
            "• User confirmed device PIN / SIM PIN.\n"
            "• User advised to make backup to iCloud.\n"
            "• User advised to update iOS to latest version available.\n"
            "• Ticket opened on ConnectWise.\n"
            "• Find My Phone disabled.\n"
            "• Face ID / Touch ID removed."
        ),
        "required": True,
    },
    {
        "title": "Device Intake",
        "description": (
            "• Old device collected and logged.\n"
            "• Device model verified.\n"
            "• Record serial number of old device in tracker.\n"
            "• Record IMEI number in tracker.\n"
            "• Backup taken as required by user.\n"
            "• Confirmed device not supervised in Intune.\n"
            "• Charger returned with phone."
        ),
        "required": True,
    },
    {
        "title": "Supervised Device Setup",
        "description": (
            "• New / replacement device issued of same or newer model.\n"
            "• Record serial number of new device in tracker.\n"
            "• Enrolled via ABM + Intune.\n"
            "• Company Portal installed and enrolled.\n"
            "• Supervised status confirmed in Intune."
        ),
        "required": True,
    },
    {
        "title": "User Setup",
        "description": (
            "• MFA / Authenticator configured and tested.\n"
            "• Outlook installed and signed in.\n"
            "• Teams installed and signed in.\n"
            "• Outlook send/receive tested.\n"
            "• Teams chat tested.\n"
            "• Authenticator working for all apps.\n"
            "• Confirmed data transfer with user (best effort only).\n"
            "• Phone fully charged.\n"
            "• Charger supplied with phone."
        ),
        "required": True,
    },
    {
        "title": "Completion",
        "description": (
            "• Tracker spreadsheet updated.\n"
            "• ConnectWise / ticket updated.\n"
            "• Attendance recorded (show/no-show)."
        ),
        "required": True,
    },
    {
        "title": "Post-Clinic",
        "description": (
            "• Old device retained for 48 hours.\n"
            "• Old device wiped.\n"
            "• Device recycled or reassigned per policy.\n"
            "• Completed checklist added to ConnectWise ticket."
        ),
        "required": True,
    },
]


def main():
    db = SessionLocal()
    try:
        clients = db.query(Client).order_by(Client.name).all()
        if not clients:
            print("No clients found. Run a LabTech sync first.")
            return

        print("\nAvailable clients:")
        for i, c in enumerate(clients):
            print(f"  {i + 1}. {c.name}")

        choice = input("\nEnter client number (or press Enter to attach to all): ").strip()

        if choice == "":
            selected = clients
        else:
            idx = int(choice) - 1
            if idx < 0 or idx >= len(clients):
                print("Invalid choice.")
                return
            selected = [clients[idx]]

        for client in selected:
            existing = db.query(ChecklistTemplate).filter(
                ChecklistTemplate.client_id == client.id,
                ChecklistTemplate.name == TEMPLATE_NAME,
            ).first()

            if existing:
                print(f"  !!  Template '{TEMPLATE_NAME}' already exists for {client.name} (id={existing.id}) -- skipping.")
                continue

            template = ChecklistTemplate(
                client_id=client.id,
                name=TEMPLATE_NAME,
                description=TEMPLATE_DESC,
                created_by="Seed Script",
            )
            db.add(template)
            db.flush()

            for i, step_data in enumerate(STEPS):
                db.add(TemplateStep(
                    template_id=template.id,
                    order=i,
                    title=step_data["title"],
                    description=step_data["description"],
                    required=step_data["required"],
                ))

            db.commit()
            print(f"  OK  Created '{TEMPLATE_NAME}' for {client.name} (template id={template.id})")

    finally:
        db.close()


if __name__ == "__main__":
    main()
