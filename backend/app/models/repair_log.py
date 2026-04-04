import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RepairStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class RepairLog(Base):
    __tablename__ = "repair_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    checked_in_by = Column(String(255), nullable=False)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    checked_out_at = Column(DateTime(timezone=True), nullable=True)
    checked_out_by = Column(String(255), nullable=True)
    issue_description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    status = Column(
        Enum(RepairStatus),
        default=RepairStatus.open,
        nullable=False,
        index=True,
    )

    device = relationship("Device", back_populates="repair_logs")
