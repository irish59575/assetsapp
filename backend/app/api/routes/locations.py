from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.location import Location
from app.models.user import User

router = APIRouter(prefix="/locations", tags=["locations"])


class LocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None


class LocationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[LocationResponse])
def list_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Location]:
    return db.query(Location).all()


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    loc_in: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Location:
    location = Location(**loc_in.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Location:
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    loc_in: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Location:
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    update_data = loc_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    db.commit()
    db.refresh(location)
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    db.delete(location)
    db.commit()
