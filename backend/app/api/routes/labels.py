from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.qr_label import QRLabel, LabelStatus
from app.models.device import Device
from app.models.user import User
from app.schemas.device import DeviceResponse
from app.schemas.label import AssignLabelRequest, GenerateLabelsRequest, QRLabelResponse
from app.services.label_service import (
    assign_label_to_device,
    generate_label_pool,
    unassign_label,
)

router = APIRouter(prefix="/labels", tags=["labels"])


def _label_to_response(label: QRLabel) -> QRLabelResponse:
    device_resp: Optional[DeviceResponse] = None
    if label.device:
        device_resp = DeviceResponse.from_device(label.device)
    return QRLabelResponse(
        id=label.id,
        label_code=label.label_code,
        status=label.status,
        device_id=label.device_id,
        device=device_resp,
        assigned_at=label.assigned_at,
        assigned_by=label.assigned_by,
        created_at=label.created_at,
    )


@router.post("/generate", response_model=List[QRLabelResponse])
def generate_labels(
    body: GenerateLabelsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[QRLabelResponse]:
    """Generate a pool of new unassigned QR labels."""
    labels = generate_label_pool(
        db,
        count=body.count,
        prefix=body.prefix,
        start_from=body.start_from,
    )
    return [_label_to_response(label) for label in labels]


@router.get("/print", response_model=List[str])
def print_labels(
    count: int = Query(50, ge=1, le=500),
    start_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[str]:
    """Return a list of label_codes for printing. Frontend renders the print sheet."""
    query = db.query(QRLabel).filter(QRLabel.status == LabelStatus.unassigned)
    if start_code:
        query = query.filter(QRLabel.label_code >= start_code)
    labels = query.order_by(QRLabel.label_code).limit(count).all()
    return [label.label_code for label in labels]


@router.get("/", response_model=List[QRLabelResponse])
def list_labels(
    status: Optional[str] = Query(None, description="Filter by status: unassigned, assigned, retired"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[QRLabelResponse]:
    """List labels, optionally filtered by status."""
    query = db.query(QRLabel)
    if status:
        try:
            status_enum = LabelStatus(status)
            query = query.filter(QRLabel.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {status}. Must be one of: unassigned, assigned, retired",
            )
    labels = query.order_by(QRLabel.label_code).offset(skip).limit(limit).all()
    return [_label_to_response(label) for label in labels]


@router.get("/{label_code}", response_model=QRLabelResponse)
def get_label(
    label_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QRLabelResponse:
    """Get a label and its linked device info."""
    label = db.query(QRLabel).filter(QRLabel.label_code == label_code).first()
    if not label:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    return _label_to_response(label)


@router.post("/{label_code}/assign", response_model=QRLabelResponse)
def assign_label(
    label_code: str,
    body: AssignLabelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QRLabelResponse:
    """Assign a label to a device."""
    label = assign_label_to_device(
        db,
        label_code=label_code,
        device_id=body.device_id,
        assigned_by=body.assigned_by,
    )
    return _label_to_response(label)


@router.post("/{label_code}/unassign", response_model=QRLabelResponse)
def unassign_label_route(
    label_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QRLabelResponse:
    """Unassign a label from its device."""
    label = unassign_label(db, label_code=label_code)
    return _label_to_response(label)
