"""
Seed script: Creates the HSA Laptop Build Process checklist template.

Usage (from the backend/ directory):
    python seed_hsa_laptop_build_template.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.client import Client
from app.models.checklist_template import ChecklistTemplate, TemplateStep


TEMPLATE_NAME = "HSA - Laptop Build Process"
TEMPLATE_DESC = "Full laptop build checklist for HSA — covers old device assessment, Windows setup, domain/Azure, security, connectivity, Office, business apps, software and end-user sign-off."

STEPS = [
    {
        "title": "Old Device — Pre-Build Assessment",
        "description": (
            "• Record device name of old device being replaced.\n"
            "• Confirm software inventory on original / old device.\n"
            "• Confirm software that will be available on new device."
        ),
        "required": True,
    },
    {
        "title": "Windows Setup",
        "description": (
            "• Install Windows.\n"
            "• Name the device.\n"
            "• Verify Windows 11 Activation."
        ),
        "required": True,
    },
    {
        "title": "Domain & Azure Configuration",
        "description": (
            "• Add device to Domain.\n"
            "• Move laptop to correct OU group.\n"
            "• Confirm Sync with Azure.\n"
            "• Confirm Hybrid Joined.\n"
            "• Confirm Intune enrolled.\n"
            "• Confirm AD owner account for this device.\n"
            "• Confirm SN added to AD."
        ),
        "required": True,
    },
    {
        "title": "User & Licensing Setup",
        "description": (
            "• Assign end user Office 365 / E5 license.\n"
            "• First login tested.\n"
            "• Rename excess accounts.\n"
            "• Configure task bar pins.\n"
            "• Run all Windows updates."
        ),
        "required": True,
    },
    {
        "title": "Security & Monitoring",
        "description": (
            "• Install Sophos.\n"
            "• Record BitLocker key.\n"
            "• Install Labtech agent.\n"
            "• Confirm device added to Asset Register.\n"
            "• Add SN and warranty expiry date to Asset Register."
        ),
        "required": True,
    },
    {
        "title": "Connectivity",
        "description": (
            "• Confirm IPV6 settings.\n"
            "• Install Fortinet VPN Client.\n"
            "• Test from Docking Station.\n"
            "• Test Wi-Fi connectivity."
        ),
        "required": True,
    },
    {
        "title": "Office Applications",
        "description": (
            "• Configure Printers.\n"
            "• Set up Office 365.\n"
            "• Configure Outlook.\n"
            "• Set up Teams.\n"
            "• Test camera, mic and audio."
        ),
        "required": True,
    },
    {
        "title": "Business Applications",
        "description": (
            "• Install and configure eDocs Outlook Add-on.\n"
            "• Install eDocs Drive / File Explorer.\n"
            "• Test eDocs in browser.\n"
            "• Test GeoSmart in browser."
        ),
        "required": True,
    },
    {
        "title": "Software Installation",
        "description": (
            "• Uninstall Microsoft bloatware (run bloatware removal script).\n"
            "• Set default apps.\n"
            "• Install required software.\n"
            "• Install Nitro.\n"
            "• Install Adobe.\n"
            "• Install Chrome.\n"
            "• Install VLC.\n"
            "• Reload software to match old device configuration."
        ),
        "required": True,
    },
    {
        "title": "End User Sign-Off",
        "description": (
            "• MFA setup and tested.\n"
            "• Induction carried out.\n"
            "• Conditional Access tested.\n"
            "• End user tests and confirms software provisioning.\n"
            "• End user tests and accepts device."
        ),
        "required": True,
    },
    {
        "title": "Post-Build Checks",
        "description": (
            "• Run Intune endpoint compliance check.\n"
            "• Generate report from Labtech.\n"
            "• Old device taken into support and stored."
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
