from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.client import Client
from app.models.device import Device, DeviceStatus
from app.models.user import User
from app.schemas.client import ClientResponse, ClientWithDeviceCount
from app.schemas.device import DeviceResponse

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("/", response_model=List[ClientWithDeviceCount])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientWithDeviceCount]:
    clients = db.query(Client).order_by(Client.name).all()
    result = []
    for client in clients:
        device_count = db.query(Device).filter(Device.client_id == client.id).count()
        item = ClientWithDeviceCount(
            id=client.id,
            name=client.name,
            labtech_client_id=client.labtech_client_id,
            created_at=client.created_at,
            updated_at=client.updated_at,
            device_count=device_count,
        )
        result.append(item)
    return result


@router.get("/{client_id}", response_model=ClientWithDeviceCount)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientWithDeviceCount:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    device_count = db.query(Device).filter(Device.client_id == client.id).count()
    return ClientWithDeviceCount(
        id=client.id,
        name=client.name,
        labtech_client_id=client.labtech_client_id,
        created_at=client.created_at,
        updated_at=client.updated_at,
        device_count=device_count,
    )


@router.get("/{client_id}/devices", response_model=List[DeviceResponse])
def list_client_devices(
    client_id: int,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DeviceResponse]:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    query = db.query(Device).filter(Device.client_id == client_id)

    if status:
        try:
            status_enum = DeviceStatus(status)
            query = query.filter(Device.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status value: {status}",
            )

    if search:
        query = query.filter(
            Device.device_name.ilike(f"%{search}%")
            | Device.serial_number.ilike(f"%{search}%")
            | Device.assigned_to.ilike(f"%{search}%")
        )

    devices = query.order_by(Device.device_name).all()
    return [DeviceResponse.from_device(d) for d in devices]
