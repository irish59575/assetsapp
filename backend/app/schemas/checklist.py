from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.models.deployment import DeploymentStatus, DeploymentStepStatus


# ── Template Schemas ──────────────────────────────────────────────────────────

class TemplateStepCreate(BaseModel):
    order: int
    title: str
    description: Optional[str] = None
    required: bool = True


class TemplateStepResponse(BaseModel):
    id: int
    template_id: int
    order: int
    title: str
    description: Optional[str] = None
    required: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    client_id: int
    name: str
    description: Optional[str] = None
    created_by: Optional[str] = None
    steps: List[TemplateStepCreate] = []


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[TemplateStepCreate]] = None


class TemplateResponse(BaseModel):
    id: int
    client_id: int
    name: str
    description: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    steps: List[TemplateStepResponse] = []

    model_config = {"from_attributes": True}


# ── Deployment Schemas ────────────────────────────────────────────────────────

class DeploymentCreate(BaseModel):
    template_id: int
    client_id: int
    engineer_name: str
    connectwise_ticket: Optional[str] = None
    notes: Optional[str] = None


class DeploymentUpdate(BaseModel):
    engineer_name: Optional[str] = None
    connectwise_ticket: Optional[str] = None
    notes: Optional[str] = None
    serial_number: Optional[str] = None
    device_name: Optional[str] = None
    label_code: Optional[str] = None


class DeploymentStepUpdate(BaseModel):
    status: DeploymentStepStatus
    notes: Optional[str] = None
    completed_by: Optional[str] = None


class StepPhotoResponse(BaseModel):
    id: int
    deployment_step_id: int
    filename: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DeploymentStepResponse(BaseModel):
    id: int
    deployment_id: int
    template_step_id: Optional[int] = None
    order: int
    title: str
    description: Optional[str] = None
    required: bool
    status: DeploymentStepStatus
    notes: Optional[str] = None
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    photos: List[StepPhotoResponse] = []

    model_config = {"from_attributes": True}


class DeploymentResponse(BaseModel):
    id: int
    template_id: int
    client_id: int
    device_id: Optional[int] = None
    engineer_name: str
    status: DeploymentStatus
    connectwise_ticket: Optional[str] = None
    notes: Optional[str] = None
    serial_number: Optional[str] = None
    device_name: Optional[str] = None
    label_code: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    steps: List[DeploymentStepResponse] = []
    template_name: Optional[str] = None
    client_name: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_deployment(cls, d) -> "DeploymentResponse":
        return cls(
            id=d.id,
            template_id=d.template_id,
            client_id=d.client_id,
            device_id=d.device_id,
            engineer_name=d.engineer_name,
            status=d.status,
            connectwise_ticket=d.connectwise_ticket,
            notes=d.notes,
            serial_number=d.serial_number,
            device_name=d.device_name,
            label_code=d.label_code,
            started_at=d.started_at,
            completed_at=d.completed_at,
            created_at=d.created_at,
            steps=[DeploymentStepResponse.model_validate(s) for s in d.steps],
            template_name=d.template.name if d.template else None,
            client_name=d.client.name if d.client else None,
        )
