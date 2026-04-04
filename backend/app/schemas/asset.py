from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.asset import AssetStatus


class CategoryBrief(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class LocationBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class AssetBase(BaseModel):
    name: str
    description: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_price: Optional[str] = None
    purchase_date: Optional[datetime] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    status: AssetStatus = AssetStatus.active


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_price: Optional[str] = None
    purchase_date: Optional[datetime] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[AssetStatus] = None


class AssetResponse(AssetBase):
    id: int
    owner_id: int
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    category_rel: Optional[CategoryBrief] = None
    location_rel: Optional[LocationBrief] = None

    model_config = {"from_attributes": True}
