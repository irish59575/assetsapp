from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ClientBase(BaseModel):
    name: str
    labtech_client_id: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientWithDeviceCount(ClientResponse):
    device_count: int = 0


class ClientWithStatusCounts(ClientWithDeviceCount):
    assigned: int = 0
    available: int = 0
    in_repair: int = 0
