from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.device import DeviceStatus
from app.models.repair_log import RepairStatus


class ClientBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class DeviceAssignmentResponse(BaseModel):
    id: int
    device_id: int
    assigned_to: str
    assigned_by: str
    assigned_at: datetime
    returned_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class RepairLogResponse(BaseModel):
    id: int
    device_id: int
    checked_in_by: str
    checked_in_at: datetime
    checked_out_at: Optional[datetime] = None
    checked_out_by: Optional[str] = None
    issue_description: str
    resolution_notes: Optional[str] = None
    status: RepairStatus

    model_config = {"from_attributes": True}


class DeviceResponse(BaseModel):
    id: int
    labtech_id: Optional[str] = None
    device_name: str
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    os_version: Optional[str] = None
    ip_address: Optional[str] = None
    ram_gb: Optional[float] = None
    disk_gb: Optional[float] = None
    last_logged_in_user: Optional[str] = None
    last_logged_in_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    status: DeviceStatus
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    assigned_by: Optional[str] = None
    qr_code: Optional[str] = None
    label_code: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_device(cls, device) -> "DeviceResponse":
        client_name = device.client.name if device.client else None
        label_code = device.qr_label.label_code if device.qr_label else None
        return cls(
            id=device.id,
            labtech_id=device.labtech_id,
            device_name=device.device_name,
            serial_number=device.serial_number,
            manufacturer=device.manufacturer,
            model=device.model,
            os_version=device.os_version,
            ip_address=device.ip_address,
            ram_gb=device.ram_gb,
            disk_gb=device.disk_gb,
            last_logged_in_user=device.last_logged_in_user,
            last_logged_in_at=device.last_logged_in_at,
            last_seen_at=device.last_seen_at,
            client_id=device.client_id,
            client_name=client_name,
            status=device.status,
            assigned_to=device.assigned_to,
            assigned_at=device.assigned_at,
            assigned_by=device.assigned_by,
            qr_code=device.qr_code,
            label_code=label_code,
            notes=device.notes,
            created_at=device.created_at,
            updated_at=device.updated_at,
        )


class DeviceAssign(BaseModel):
    assigned_to: str
    assigned_by: str
    notes: Optional[str] = None


class DeviceUnassign(BaseModel):
    pass


class RepairCheckIn(BaseModel):
    checked_in_by: str
    issue_description: str


class RepairCheckOut(BaseModel):
    checked_out_by: str
    resolution_notes: Optional[str] = None


class DeviceSetStatus(BaseModel):
    status: DeviceStatus
    notes: Optional[str] = None


class StatusLogResponse(BaseModel):
    id: int
    device_id: int
    status: str
    changed_by: Optional[str] = None
    notes: Optional[str] = None
    changed_at: datetime

    model_config = {"from_attributes": True}


class DeviceHistoryResponse(BaseModel):
    assignments: List[DeviceAssignmentResponse]
    repair_logs: List[RepairLogResponse]
    status_logs: List[StatusLogResponse] = []
