"""
Seed script: Creates the FAI Laptop Build Process checklist template.

Usage (from the backend/ directory):
    python seed_fai_laptop_build_template.py

The script will prompt you for the client to attach the template to.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.client import Client
from app.models.checklist_template import ChecklistTemplate, TemplateStep


TEMPLATE_NAME = "Laptop Build Process"
TEMPLATE_DESC = "Standard build checklist for new Windows laptops — OS setup, domain join, Intune, VPN."

STEPS = [
    {
        "title": "Initial Device Boot & Setup",
        "description": (
            "• Power on the new laptop and complete the initial Windows setup wizard.\n"
            "• Select the correct Region and Language settings.\n"
            "• Connect the device to the corporate network via LAN or corporate WiFi.\n"
            "• Run initial Windows updates where prompted.\n"
            "• Accept the Microsoft license agreement."
        ),
        "required": True,
    },
    {
        "title": "Device Naming",
        "description": (
            "• When prompted to name the device, select \"Skip for now\".\n"
            "• The device will be named after joining the domain."
        ),
        "required": True,
    },
    {
        "title": "Device Configuration",
        "description": (
            "• Select \"Set up for work or school\" as the device configuration option."
        ),
        "required": True,
    },
    {
        "title": "Initial Sign-In Setup",
        "description": (
            "• At the sign-in screen, select \"Domain join instead\".\n"
            "• Use the local administrator account (faiadmin) to complete setup.\n"
            "• Do not sign in with a Microsoft/domain account at this stage."
        ),
        "required": True,
    },
    {
        "title": "Security Questions",
        "description": (
            "• Configure security questions when prompted.\n"
            "• Set all answers to the standard value (check with your team lead if unsure)."
        ),
        "required": True,
    },
    {
        "title": "Windows Setup Preferences",
        "description": (
            "• When prompted for additional Windows setup options, select \"No\".\n"
            "• This allows the end user to configure their own preferences later."
        ),
        "required": True,
    },
    {
        "title": "Vendor Registration",
        "description": (
            "• Skip the Dell (or manufacturer) registration page.\n"
            "• Accept the terms and conditions to proceed."
        ),
        "required": True,
    },
    {
        "title": "System Updates",
        "description": (
            "• After reaching the desktop, run all Windows updates.\n"
            "• Repeat until no further updates are available — device must be fully up to date."
        ),
        "required": True,
    },
    {
        "title": "Domain Join",
        "description": (
            "• Log in using the local admin account (faiadmin).\n"
            "• Join the device to the corporate domain.\n"
            "• Restart the device when prompted."
        ),
        "required": True,
    },
    {
        "title": "Active Directory Configuration",
        "description": (
            "• Log into the Domain Controller.\n"
            "• Locate the device object under Computers.\n"
            "• Move the device to the appropriate Intune Device Group."
        ),
        "required": True,
    },
    {
        "title": "Final Device Preparation",
        "description": (
            "• Install Microsoft 365 / Office 365 as required.\n"
            "• Perform a user sign-in for validation.\n"
            "• Confirm device is ready for the assigned user."
        ),
        "required": True,
    },
    {
        "title": "Intune Deployment",
        "description": (
            "• Allow the device to sync with Microsoft Intune.\n"
            "• Verify that applications and policies deploy automatically from Intune.\n"
            "• Wait for all Intune-managed apps to install before handing over."
        ),
        "required": True,
    },
    {
        "title": "VPN Install",
        "description": (
            "• Install and configure the corporate VPN client.\n"
            "• Test the VPN connection is working correctly before handover."
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
