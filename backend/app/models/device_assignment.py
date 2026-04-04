from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    assigned_to = Column(String(255), nullable=False)
    assigned_by = Column(String(255), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    device = relationship("Device", back_populates="assignment_history")
