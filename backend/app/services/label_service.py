"""
Service layer for QR label pool management and label-to-device assignment.
"""

import re
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.qr_label import QRLabel, LabelStatus


def _parse_label_number(label_code: str) -> Optional[int]:
    """Extract the numeric suffix from a label code like 'ASST-00042' → 42."""
    match = re.match(r"^[A-Z]+-(\d+)$", label_code)
    if match:
        return int(match.group(1))
    return None


def _format_label_code(prefix: str, number: int) -> str:
    return f"{prefix}-{number:05d}"


def generate_label_pool(
    db: Session,
    count: int,
    prefix: str = "ASST",
    start_from: Optional[int] = None,
) -> List[QRLabel]:
    """
    Generate `count` new QRLabel records.
    Auto-increments from the highest existing label number for this prefix.
    Format: ASST-00001 through ASST-99999.
    Returns list of created labels.
    """
    if count < 1 or count > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="count must be between 1 and 1000",
        )

    # Find the current max number for this prefix
    pattern = f"{prefix}-%"
    existing = (
        db.query(QRLabel)
        .filter(QRLabel.label_code.like(pattern))
        .all()
    )
    max_number = 0
    for label in existing:
        n = _parse_label_number(label.label_code)
        if n is not None and n > max_number:
            max_number = n

    if start_from is not None and start_from > max_number:
        next_number = start_from
    else:
        next_number = max_number + 1

    created: List[QRLabel] = []
    for i in range(count):
        number = next_number + i
        if number > 99999:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Label number would exceed maximum (99999) at position {i + 1}",
            )
        code = _format_label_code(prefix, number)
        label = QRLabel(label_code=code, status=LabelStatus.unassigned)
        db.add(label)
        created.append(label)

    db.commit()
    for label in created:
        db.refresh(label)
    return created


def assign_label_to_device(
    db: Session,
    label_code: str,
    device_id: int,
    assigned_by: str,
) -> QRLabel:
    """
    Link a QRLabel to a Device.
    - Validates label exists and is unassigned.
    - Validates device exists and has no label already.
    - Sets label.device_id, label.status=assigned, label.assigned_at, label.assigned_by.
    - Sets device.qr_code = label.label_code.
    - Returns updated label.
    """
    label = db.query(QRLabel).filter(QRLabel.label_code == label_code).first()
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found",
        )
    if label.status != LabelStatus.unassigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Label is not unassigned (current status: {label.status.value})",
        )

    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Check if device already has a label
    existing_label = (
        db.query(QRLabel)
        .filter(QRLabel.device_id == device_id)
        .first()
    )
    if existing_label:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device already has label {existing_label.label_code} assigned",
        )

    now = datetime.now(timezone.utc)
    label.device_id = device_id
    label.status = LabelStatus.assigned
    label.assigned_at = now
    label.assigned_by = assigned_by

    # Store just the code in device.qr_code
    device.qr_code = label_code

    db.commit()
    db.refresh(label)
    return label


def unassign_label(db: Session, label_code: str) -> QRLabel:
    """
    Unlink a label from its device.
    - Sets label.status=unassigned, label.device_id=None.
    - Clears device.qr_code.
    - Returns updated label.
    """
    label = db.query(QRLabel).filter(QRLabel.label_code == label_code).first()
    if not label:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Label not found",
        )
    if label.status != LabelStatus.assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Label is not currently assigned (status: {label.status.value})",
        )

    device = db.query(Device).filter(Device.id == label.device_id).first()
    if device:
        device.qr_code = None

    label.device_id = None
    label.status = LabelStatus.unassigned
    label.assigned_at = None
    label.assigned_by = None

    db.commit()
    db.refresh(label)
    return label
