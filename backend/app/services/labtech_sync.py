"""
Connects to LabTech (ConnectWise Automate) MySQL database and syncs
computers into local Device + Client tables.

Uses pymysql directly (separate connection from the app's SQLAlchemy engine).
"""

import base64
import io
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

import qrcode

from app.core.config import settings

logger = logging.getLogger(__name__)

LABTECH_QUERY = """
SELECT
    c.ComputerID,
    c.Name AS device_name,
    c.SerialNumber,
    c.LastContact,
    c.LastUser,
    c.OperatingSystem,
    c.Manufacturer,
    c.Model,
    c.LocalAddress AS ip_address,
    ROUND(c.TotalMemory / 1024.0, 1) AS ram_gb,
    cl.ClientID AS labtech_client_id,
    cl.Name AS client_name,
    d.disk_gb
FROM computers c
JOIN clients cl ON c.ClientID = cl.ClientID
LEFT JOIN (
    SELECT ComputerID, ROUND(SUM(Size) / 1024.0, 0) AS disk_gb
    FROM drives
    WHERE DriveType = 3
    GROUP BY ComputerID
) d ON c.ComputerID = d.ComputerID
WHERE c.ComputerType IN (1, 2)
"""


def _generate_qr_data_url(device_id: int) -> str:
    data = f"device:{device_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def sync_labtech(db_session) -> Dict[str, Any]:
    """
    Pull computers from LabTech MySQL, upsert into local Device + Client tables.

    Returns a dict: {created, updated, clients_synced, error}
    """
    from app.models.client import Client
    from app.models.device import Device, DeviceStatus

    if not settings.LABTECH_HOST:
        return {
            "created": 0,
            "updated": 0,
            "clients_synced": 0,
            "error": "LABTECH_HOST is not configured. Set it in your .env file.",
        }

    try:
        import pymysql
    except ImportError:
        return {
            "created": 0,
            "updated": 0,
            "clients_synced": 0,
            "error": "pymysql is not installed. Run: pip install pymysql",
        }

    try:
        conn = pymysql.connect(
            host=settings.LABTECH_HOST,
            port=settings.LABTECH_PORT,
            user=settings.LABTECH_USER,
            password=settings.LABTECH_PASSWORD,
            database=settings.LABTECH_DB,
            connect_timeout=10,
            cursorclass=pymysql.cursors.DictCursor,
        )
    except Exception as exc:
        logger.error("LabTech connection failed: %s", exc)
        return {
            "created": 0,
            "updated": 0,
            "clients_synced": 0,
            "error": f"Could not connect to LabTech: {exc}",
        }

    try:
        with conn.cursor() as cursor:
            cursor.execute(LABTECH_QUERY)
            rows = cursor.fetchall()
    except Exception as exc:
        conn.close()
        logger.error("LabTech query failed: %s", exc)
        return {
            "created": 0,
            "updated": 0,
            "clients_synced": 0,
            "error": f"LabTech query failed: {exc}",
        }
    finally:
        conn.close()

    created = 0
    updated = 0
    clients_synced_ids: set = set()
    seen_labtech_ids: set = set()

    for row in rows:
        labtech_client_id = str(row["labtech_client_id"])
        client_name = row["client_name"] or "Unknown Client"

        # Upsert client
        client = db_session.query(Client).filter(
            Client.labtech_client_id == labtech_client_id
        ).first()
        if client is None:
            client = Client(name=client_name, labtech_client_id=labtech_client_id)
            db_session.add(client)
            db_session.flush()
        else:
            if client.name != client_name:
                client.name = client_name
        clients_synced_ids.add(labtech_client_id)

        labtech_id = str(row["ComputerID"])
        seen_labtech_ids.add(labtech_id)

        # Parse dates — LabTech stores as datetime objects or None
        last_seen = row.get("LastContact")
        if isinstance(last_seen, str):
            try:
                last_seen = datetime.fromisoformat(last_seen)
            except ValueError:
                last_seen = None

        last_user_time = None  # LabTech doesn't expose this directly

        # Upsert device
        device = db_session.query(Device).filter(Device.labtech_id == labtech_id).first()
        if device is None:
            device = Device(
                labtech_id=labtech_id,
                device_name=row.get("device_name") or "Unknown",
                serial_number=row.get("SerialNumber") or None,
                manufacturer=row.get("Manufacturer") or None,
                model=row.get("Model") or None,
                os_version=row.get("OperatingSystem") or None,
                ip_address=row.get("ip_address") or None,
                ram_gb=row.get("ram_gb"),
                disk_gb=row.get("disk_gb"),
                last_logged_in_user=row.get("LastUser") or None,
                last_logged_in_at=last_user_time,
                last_seen_at=last_seen,
                client_id=client.id,
                status=DeviceStatus.available,
            )
            db_session.add(device)
            db_session.flush()
            # Generate QR code now that we have an ID
            device.qr_code = _generate_qr_data_url(device.id)
            created += 1
        else:
            device.device_name = row.get("device_name") or device.device_name
            device.serial_number = row.get("SerialNumber") or device.serial_number
            device.manufacturer = row.get("Manufacturer") or device.manufacturer
            device.model = row.get("Model") or device.model
            device.os_version = row.get("OperatingSystem") or device.os_version
            device.ip_address = row.get("ip_address") or device.ip_address
            device.ram_gb = row.get("ram_gb") or device.ram_gb
            device.disk_gb = row.get("disk_gb") or device.disk_gb
            device.last_logged_in_user = row.get("LastUser") or device.last_logged_in_user
            device.last_seen_at = last_seen or device.last_seen_at
            device.client_id = client.id
            # Regenerate QR if missing
            if not device.qr_code:
                device.qr_code = _generate_qr_data_url(device.id)
            updated += 1

    # Retire devices not seen in LabTech for 30+ days
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    stale_devices = (
        db_session.query(Device)
        .filter(
            Device.labtech_id.isnot(None),
            Device.status != DeviceStatus.retired,
        )
        .all()
    )
    for dev in stale_devices:
        if dev.labtech_id not in seen_labtech_ids:
            last_seen_dt = dev.last_seen_at
            # Make naive datetimes timezone-aware for comparison
            if last_seen_dt and last_seen_dt.tzinfo is None:
                last_seen_dt = last_seen_dt.replace(tzinfo=timezone.utc)
            if last_seen_dt is None or last_seen_dt < cutoff:
                dev.status = DeviceStatus.retired

    db_session.commit()

    return {
        "created": created,
        "updated": updated,
        "clients_synced": len(clients_synced_ids),
        "error": None,
    }
