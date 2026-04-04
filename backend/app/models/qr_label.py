import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LabelStatus(str, enum.Enum):
    unassigned = "unassigned"
    assigned = "assigned"
    retired = "retired"


class QRLabel(Base):
    __tablename__ = "qr_labels"

    id = Column(Integer, primary_key=True, index=True)
    label_code = Column(String(20), unique=True, nullable=False, index=True)
    status = Column(
        Enum(LabelStatus),
        default=LabelStatus.unassigned,
        nullable=False,
        index=True,
    )
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, unique=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    assigned_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    device = relationship("Device", backref="qr_label", uselist=False)
