import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_allowed_client_ids, assert_client_access
from app.models.checklist_template import ChecklistTemplate
from app.models.deployment import Deployment, DeploymentStep, DeploymentStatus, DeploymentStepStatus, StepPhoto
from app.models.device import Device, DeviceStatus
from app.models.qr_label import QRLabel, LabelStatus
from app.models.user import User
from app.schemas.checklist import (
    DeploymentCreate,
    DeploymentUpdate,
    DeploymentStepUpdate,
    DeploymentResponse,
    StepPhotoResponse,
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "step_photos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/deployments", tags=["deployments"])


def _get_deployment_or_404(deployment_id: int, db: Session) -> Deployment:
    d = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deployment not found")
    return d


@router.get("/", response_model=List[DeploymentResponse])
def list_deployments(
    client_id: Optional[int] = Query(None),
    dep_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Deployment)
    allowed = get_allowed_client_ids(current_user, db)
    if allowed is not None:
        q = q.filter(Deployment.client_id.in_(allowed))
    if client_id is not None:
        assert_client_access(client_id, current_user, db)
        q = q.filter(Deployment.client_id == client_id)
    if dep_status:
        q = q.filter(Deployment.status == dep_status)
    deployments = q.order_by(Deployment.started_at.desc()).all()
    return [DeploymentResponse.from_deployment(d) for d in deployments]


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = _get_deployment_or_404(deployment_id, db)
    if d.client_id:
        assert_client_access(d.client_id, current_user, db)
    return DeploymentResponse.from_deployment(d)


@router.post("/", response_model=DeploymentResponse, status_code=status.HTTP_201_CREATED)
def create_deployment(
    body: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == body.template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    deployment = Deployment(
        template_id=body.template_id,
        client_id=body.client_id,
        engineer_name=body.engineer_name,
        connectwise_ticket=body.connectwise_ticket,
        notes=body.notes,
        status=DeploymentStatus.in_progress,
    )
    db.add(deployment)
    db.flush()

    # Copy template steps into deployment steps
    for step in template.steps:
        db.add(DeploymentStep(
            deployment_id=deployment.id,
            template_step_id=step.id,
            order=step.order,
            title=step.title,
            description=step.description,
            required=step.required,
            status=DeploymentStepStatus.pending,
        ))

    db.commit()
    db.refresh(deployment)
    return DeploymentResponse.from_deployment(deployment)


@router.patch("/{deployment_id}", response_model=DeploymentResponse)
def update_deployment(
    deployment_id: int,
    body: DeploymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update deployment metadata (serial, device name, CW ticket, label, notes)."""
    deployment = _get_deployment_or_404(deployment_id, db)

    if body.engineer_name is not None:
        deployment.engineer_name = body.engineer_name
    if body.connectwise_ticket is not None:
        deployment.connectwise_ticket = body.connectwise_ticket
    if body.notes is not None:
        deployment.notes = body.notes
    if body.device_name is not None:
        deployment.device_name = body.device_name

    # When serial number is set, create/link a pre-provisioned device
    if body.serial_number is not None and body.serial_number != deployment.serial_number:
        deployment.serial_number = body.serial_number
        # Check if a device already exists with this serial
        existing = db.query(Device).filter(Device.serial_number == body.serial_number).first()
        if existing:
            deployment.device_id = existing.id
        else:
            # Create pre-provisioned device
            new_device = Device(
                device_name=body.device_name or deployment.device_name or body.serial_number,
                serial_number=body.serial_number,
                client_id=deployment.client_id,
                status=DeviceStatus.pre_provisioning,
            )
            db.add(new_device)
            db.flush()
            deployment.device_id = new_device.id

    # When label code is set, assign the QR label to the device
    if body.label_code is not None and body.label_code != deployment.label_code:
        deployment.label_code = body.label_code
        label = db.query(QRLabel).filter(QRLabel.label_code == body.label_code).first()
        if label and deployment.device_id:
            label.device_id = deployment.device_id
            label.status = LabelStatus.assigned
            label.assigned_at = datetime.now(timezone.utc)
            label.assigned_by = deployment.engineer_name

    db.commit()
    db.refresh(deployment)
    return DeploymentResponse.from_deployment(deployment)


@router.patch("/{deployment_id}/steps/{step_id}", response_model=DeploymentResponse)
def update_step(
    deployment_id: int,
    step_id: int,
    body: DeploymentStepUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a step done/skipped/pending."""
    deployment = _get_deployment_or_404(deployment_id, db)
    step = db.query(DeploymentStep).filter(
        DeploymentStep.id == step_id,
        DeploymentStep.deployment_id == deployment_id,
    ).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    step.status = body.status
    if body.notes is not None:
        step.notes = body.notes
    if body.completed_by is not None:
        step.completed_by = body.completed_by

    if body.status in (DeploymentStepStatus.done, DeploymentStepStatus.skipped, DeploymentStepStatus.na):
        if not step.completed_at:
            step.completed_at = datetime.now(timezone.utc)
    else:
        step.completed_at = None

    db.commit()
    db.refresh(deployment)
    return DeploymentResponse.from_deployment(deployment)


@router.post("/{deployment_id}/complete", response_model=DeploymentResponse)
def complete_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark deployment complete. Transitions pre-provisioned device to available if not yet live."""
    deployment = _get_deployment_or_404(deployment_id, db)

    if deployment.status != DeploymentStatus.in_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deployment is not in progress",
        )

    deployment.status = DeploymentStatus.complete
    deployment.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(deployment)
    return DeploymentResponse.from_deployment(deployment)


@router.post("/{deployment_id}/cancel", response_model=DeploymentResponse)
def cancel_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = _get_deployment_or_404(deployment_id, db)
    deployment.status = DeploymentStatus.cancelled
    db.commit()
    db.refresh(deployment)
    return DeploymentResponse.from_deployment(deployment)


@router.post("/{deployment_id}/send-to-connectwise")
def send_to_connectwise(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.connectwise_service import send_deployment_to_connectwise, ConnectWiseError
    deployment = _get_deployment_or_404(deployment_id, db)
    deployment_response = DeploymentResponse.from_deployment(deployment)
    try:
        result = send_deployment_to_connectwise(deployment_response)
        return {"success": True, "document": result}
    except ConnectWiseError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{deployment_id}", status_code=204)
def delete_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deployment = _get_deployment_or_404(deployment_id, db)
    db.delete(deployment)
    db.commit()


@router.post("/{deployment_id}/steps/{step_id}/photos", response_model=StepPhotoResponse)
async def upload_step_photo(
    deployment_id: int,
    step_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a photo for a deployment step."""
    _get_deployment_or_404(deployment_id, db)
    step = db.query(DeploymentStep).filter(
        DeploymentStep.id == step_id,
        DeploymentStep.deployment_id == deployment_id,
    ).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    # Validate file type
    allowed = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{step_id}_{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    photo = StepPhoto(deployment_step_id=step_id, filename=filename)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/{deployment_id}/steps/{step_id}/photos/{photo_id}", status_code=204)
def delete_step_photo(
    deployment_id: int,
    step_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo = db.query(StepPhoto).filter(
        StepPhoto.id == photo_id,
        StepPhoto.deployment_step_id == step_id,
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    file_path = os.path.join(UPLOAD_DIR, photo.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.delete(photo)
    db.commit()
