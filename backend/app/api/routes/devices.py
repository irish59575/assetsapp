import csv
import io
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.device import Device, DeviceStatus
from app.models.device_assignment import DeviceAssignment
from app.models.repair_log import RepairLog, RepairStatus
from app.models.user import User
from app.schemas.device import (
    DeviceAssign,
    DeviceHistoryResponse,
    DeviceResponse,
    RepairCheckIn,
    RepairCheckOut,
    DeviceAssignmentResponse,
    RepairLogResponse,
)

router = APIRouter(prefix="/devices", tags=["devices"])


def _get_device_or_404(device_id: int, db: Session) -> Device:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.get("/export")
def export_devices_csv(
    client_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export devices as CSV, optionally filtered by client."""
    query = db.query(Device)
    if client_id:
        query = query.filter(Device.client_id == client_id)
    devices = query.order_by(Device.device_name).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Device Name", "Serial Number", "Manufacturer", "Model",
        "OS Version", "IP Address", "RAM (GB)", "Disk (GB)",
        "Client", "Status", "Assigned To", "Assigned By", "Assigned At",
        "Last Seen", "Notes",
    ])
    for d in devices:
        client_name = d.client.name if d.client else ""
        writer.writerow([
            d.id,
            d.device_name,
            d.serial_number or "",
            d.manufacturer or "",
            d.model or "",
            d.os_version or "",
            d.ip_address or "",
            d.ram_gb or "",
            d.disk_gb or "",
            client_name,
            d.status.value,
            d.assigned_to or "",
            d.assigned_by or "",
            d.assigned_at.isoformat() if d.assigned_at else "",
            d.last_seen_at.isoformat() if d.last_seen_at else "",
            d.notes or "",
        ])

    output.seek(0)
    filename = f"devices_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/scan/{qr_data}", response_model=DeviceResponse)
def scan_device(
    qr_data: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    """Look up a device by QR code data string (format: 'device:<id>')."""
    if not qr_data.startswith("device:"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code format. Expected 'device:<id>'",
        )
    try:
        device_id = int(qr_data.split(":", 1)[1])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid device ID in QR code",
        )
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return DeviceResponse.from_device(device)


@router.get("/", response_model=List[DeviceResponse])
def list_devices(
    client_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DeviceResponse]:
    query = db.query(Device)

    if client_id:
        query = query.filter(Device.client_id == client_id)

    if status:
        try:
            status_enum = DeviceStatus(status)
            query = query.filter(Device.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}",
            )

    if search:
        query = query.filter(
            Device.device_name.ilike(f"%{search}%")
            | Device.serial_number.ilike(f"%{search}%")
            | Device.assigned_to.ilike(f"%{search}%")
        )

    devices = query.order_by(Device.device_name).offset(skip).limit(limit).all()
    return [DeviceResponse.from_device(d) for d in devices]


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    device = _get_device_or_404(device_id, db)
    return DeviceResponse.from_device(device)


@router.post("/{device_id}/assign", response_model=DeviceResponse)
def assign_device(
    device_id: int,
    body: DeviceAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    device = _get_device_or_404(device_id, db)

    if device.status == DeviceStatus.in_repair:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a device that is currently in repair",
        )
    if device.status == DeviceStatus.retired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a retired device",
        )

    now = datetime.now(timezone.utc)
    device.status = DeviceStatus.assigned
    device.assigned_to = body.assigned_to
    device.assigned_by = body.assigned_by
    device.assigned_at = now

    assignment = DeviceAssignment(
        device_id=device.id,
        assigned_to=body.assigned_to,
        assigned_by=body.assigned_by,
        assigned_at=now,
        notes=body.notes,
    )
    db.add(assignment)
    db.commit()
    db.refresh(device)
    return DeviceResponse.from_device(device)


@router.post("/{device_id}/unassign", response_model=DeviceResponse)
def unassign_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    device = _get_device_or_404(device_id, db)

    if device.status != DeviceStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device is not currently assigned",
        )

    # Close the most recent open assignment
    latest = (
        db.query(DeviceAssignment)
        .filter(
            DeviceAssignment.device_id == device_id,
            DeviceAssignment.returned_at.is_(None),
        )
        .order_by(DeviceAssignment.assigned_at.desc())
        .first()
    )
    if latest:
        latest.returned_at = datetime.now(timezone.utc)

    device.status = DeviceStatus.available
    device.assigned_to = None
    device.assigned_by = None
    device.assigned_at = None

    db.commit()
    db.refresh(device)
    return DeviceResponse.from_device(device)


@router.post("/{device_id}/checkin", response_model=DeviceResponse)
def checkin_device(
    device_id: int,
    body: RepairCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    device = _get_device_or_404(device_id, db)

    if device.status == DeviceStatus.in_repair:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device is already checked in for repair",
        )
    if device.status == DeviceStatus.retired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in a retired device",
        )

    repair = RepairLog(
        device_id=device.id,
        checked_in_by=body.checked_in_by,
        issue_description=body.issue_description,
        status=RepairStatus.open,
    )
    db.add(repair)

    device.status = DeviceStatus.in_repair
    # If it was assigned, unassign
    if device.assigned_to:
        latest = (
            db.query(DeviceAssignment)
            .filter(
                DeviceAssignment.device_id == device_id,
                DeviceAssignment.returned_at.is_(None),
            )
            .order_by(DeviceAssignment.assigned_at.desc())
            .first()
        )
        if latest:
            latest.returned_at = datetime.now(timezone.utc)
        device.assigned_to = None
        device.assigned_by = None
        device.assigned_at = None

    db.commit()
    db.refresh(device)
    return DeviceResponse.from_device(device)


@router.post("/{device_id}/checkout", response_model=DeviceResponse)
def checkout_device(
    device_id: int,
    body: RepairCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceResponse:
    device = _get_device_or_404(device_id, db)

    if device.status != DeviceStatus.in_repair:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device is not currently in repair",
        )

    # Close the most recent open repair log
    repair = (
        db.query(RepairLog)
        .filter(
            RepairLog.device_id == device_id,
            RepairLog.status == RepairStatus.open,
        )
        .order_by(RepairLog.checked_in_at.desc())
        .first()
    )
    if repair:
        repair.checked_out_at = datetime.now(timezone.utc)
        repair.checked_out_by = body.checked_out_by
        repair.resolution_notes = body.resolution_notes
        repair.status = RepairStatus.resolved

    device.status = DeviceStatus.available

    db.commit()
    db.refresh(device)
    return DeviceResponse.from_device(device)


@router.get("/{device_id}/history", response_model=DeviceHistoryResponse)
def get_device_history(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeviceHistoryResponse:
    _get_device_or_404(device_id, db)

    assignments = (
        db.query(DeviceAssignment)
        .filter(DeviceAssignment.device_id == device_id)
        .order_by(DeviceAssignment.assigned_at.desc())
        .all()
    )
    repairs = (
        db.query(RepairLog)
        .filter(RepairLog.device_id == device_id)
        .order_by(RepairLog.checked_in_at.desc())
        .all()
    )

    return DeviceHistoryResponse(
        assignments=[DeviceAssignmentResponse.model_validate(a) for a in assignments],
        repair_logs=[RepairLogResponse.model_validate(r) for r in repairs],
    )
