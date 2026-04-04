from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.client import Client
from app.models.device import Device, DeviceStatus
from app.models.user import User
from app.schemas.client import ClientResponse, ClientWithDeviceCount, ClientWithStatusCounts
from app.schemas.device import DeviceResponse

router = APIRouter(prefix="/clients", tags=["clients"])


def _build_client_with_counts(client: Client, db: Session) -> ClientWithStatusCounts:
    base_q = db.query(Device).filter(Device.client_id == client.id)
    total = base_q.count()
    assigned = base_q.filter(Device.status == DeviceStatus.assigned).count()
    available = base_q.filter(Device.status == DeviceStatus.available).count()
    in_repair = base_q.filter(Device.status == DeviceStatus.in_repair).count()
    return ClientWithStatusCounts(
        id=client.id,
        name=client.name,
        labtech_client_id=client.labtech_client_id,
        created_at=client.created_at,
        updated_at=client.updated_at,
        device_count=total,
        assigned=assigned,
        available=available,
        in_repair=in_repair,
    )


@router.get("/", response_model=List[ClientWithStatusCounts])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClientWithStatusCounts]:
    clients = db.query(Client).order_by(Client.name).all()
    return [_build_client_with_counts(c, db) for c in clients]


@router.get("/{client_id}", response_model=ClientWithStatusCounts)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ClientWithStatusCounts:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return _build_client_with_counts(client, db)


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
