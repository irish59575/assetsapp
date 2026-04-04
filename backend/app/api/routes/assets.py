import io
import base64
from typing import List, Optional

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.database import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter(prefix="/assets", tags=["assets"])


def _generate_qr_data_url(asset_id: int) -> str:
    data = f"asset:{asset_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


@router.get("/", response_model=List[AssetResponse])
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Asset]:
    query = db.query(Asset).filter(Asset.owner_id == current_user.id)
    if search:
        query = query.filter(
            Asset.name.ilike(f"%{search}%") | Asset.description.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Asset.status == status)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if location_id:
        query = query.filter(Asset.location_id == location_id)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Asset:
    asset = Asset(**asset_in.model_dump(), owner_id=current_user.id)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    # Generate QR code after we have the ID
    asset.qr_code = _generate_qr_data_url(asset.id)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Asset:
    asset = db.query(Asset).filter(
        Asset.id == asset_id, Asset.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Asset:
    asset = db.query(Asset).filter(
        Asset.id == asset_id, Asset.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    asset = db.query(Asset).filter(
        Asset.id == asset_id, Asset.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    db.delete(asset)
    db.commit()


@router.get("/{asset_id}/qrcode")
def get_asset_qrcode(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    asset = db.query(Asset).filter(
        Asset.id == asset_id, Asset.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    data = f"asset:{asset_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")


@router.post("/{asset_id}/qrcode/regenerate", response_model=AssetResponse)
def regenerate_qrcode(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Asset:
    asset = db.query(Asset).filter(
        Asset.id == asset_id, Asset.owner_id == current_user.id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    asset.qr_code = _generate_qr_data_url(asset.id)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/scan/{qr_data}", response_model=AssetResponse)
def scan_asset(
    qr_data: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Asset:
    """Look up an asset by QR code data string (format: 'asset:<id>')."""
    if not qr_data.startswith("asset:"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid QR code format",
        )
    try:
        asset_id = int(qr_data.split(":", 1)[1])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid asset ID in QR code",
        )
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset
