import enum
from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, String, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AssetStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    disposed = "disposed"
    lost = "lost"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    serial_number = Column(String(200), nullable=True, index=True)
    purchase_price = Column(String(50), nullable=True)
    purchase_date = Column(DateTime(timezone=True), nullable=True)

    # Foreign keys
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Asset identifiers
    qr_code = Column(String(500), nullable=True)
    barcode = Column(String(200), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)

    # Status
    status = Column(
        Enum(AssetStatus),
        default=AssetStatus.active,
        nullable=False,
        index=True,
    )

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    owner = relationship("User", back_populates="assets")
    category_rel = relationship("Category", back_populates="assets")
    location_rel = relationship("Location", back_populates="assets")
