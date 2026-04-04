from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.qr_label import LabelStatus
from app.schemas.device import DeviceResponse


class QRLabelResponse(BaseModel):
    id: int
    label_code: str
    status: LabelStatus
    device_id: Optional[int] = None
    device: Optional[DeviceResponse] = None
    assigned_at: Optional[datetime] = None
    assigned_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateLabelsRequest(BaseModel):
    count: int = Field(..., ge=1, le=1000, description="Number of labels to generate")
    prefix: str = Field("ASST", description="Label prefix, e.g. ASST")
    start_from: Optional[int] = Field(None, ge=1, description="Override start number")


class AssignLabelRequest(BaseModel):
    device_id: int
    assigned_by: str
