"""
Seed script: Creates the FAI New Staff Onboarding checklist template.

Usage (from the backend/ directory):
    python seed_fai_template.py

The script will prompt you for the client name to attach the template to.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.client import Client
from app.models.checklist_template import ChecklistTemplate, TemplateStep


TEMPLATE_NAME = "New Staff Onboarding"
TEMPLATE_DESC = "Standard onboarding checklist for new staff members — AD account, Office 365, hardware setup."

STEPS = [
    {
        "title": "Create a user in Active Directory",
        "description": (
            "• Log on to DC01 and open Active Directory Users and Computers.\n"
            "• HR will advise the department — place the user in: FAI.ie -> FAI Staff -> Department OU.\n"
            "• Right-click a similar user -> Copy.\n"
            "• Enter details using naming convention: first.last (e.g., Richard.Barry).\n"
            "• Set initial password and required options.\n"
            "• If not copying a user, HR's submission form lists the groups the new user should be added to."
        ),
        "required": True,
    },
    {
        "title": "Force Office 365 Sync",
        "description": (
            "• Login to DC01.\n"
            "• Launch PowerShell as admin.\n"
            '• Enter command: Start-ADSyncSyncCycle -PolicyType Delta'
        ),
        "required": True,
    },
    {
        "title": "Assign a 365 Mailbox Licence",
        "description": (
            "• Go to admin.microsoft.com -> Users -> Active users.\n"
            "• Open the user -> Licenses & apps.\n"
            "• Tick the required licence and services.\n"
            "• Click Save."
        ),
        "required": True,
    },
    {
        "title": "Multi-Factor Authentication Setup",
        "description": (
            "• Ensure user sets up Microsoft Authenticator when prompted.\n"
            "• Test this by logging into Office 365.\n"
            "• If you do not have the user's phone, you'll need to do this as part of the induction."
        ),
        "required": True,
    },
    {
        "title": "Induction",
        "description": "Please remember to complete staff Induction.",
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
            # Check if template already exists for this client
            existing = db.query(ChecklistTemplate).filter(
                ChecklistTemplate.client_id == client.id,
                ChecklistTemplate.name == TEMPLATE_NAME,
            ).first()

            if existing:
                print(f"  !!  Template '{TEMPLATE_NAME}' already exists for {client.name} (id={existing.id}) — skipping.")
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
