import enum
from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DeviceStatus(str, enum.Enum):
    pre_provisioning = "pre_provisioning"
    available = "available"
    assigned = "assigned"
    in_repair = "in_repair"
    retired = "retired"
    disposed = "disposed"
    for_parts = "for_parts"
    lost = "lost"
    stolen = "stolen"


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)

    # LabTech fields
    labtech_id = Column(String(100), unique=True, nullable=True, index=True)
    device_name = Column(String(255), nullable=False, index=True)
    serial_number = Column(String(200), nullable=True, index=True)
    manufacturer = Column(String(200), nullable=True)
    model = Column(String(200), nullable=True)
    os_version = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    ram_gb = Column(Float, nullable=True)
    disk_gb = Column(Float, nullable=True)
    last_logged_in_user = Column(String(255), nullable=True)
    last_logged_in_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    # Client relationship
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)

    # Status / assignment
    status = Column(
        Enum(DeviceStatus),
        default=DeviceStatus.available,
        nullable=False,
        index=True,
    )
    assigned_to = Column(String(255), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    assigned_by = Column(String(255), nullable=True)

    # QR & notes
    qr_code = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    client = relationship("Client", back_populates="devices")
    assignment_history = relationship(
        "DeviceAssignment", back_populates="device", order_by="DeviceAssignment.assigned_at.desc()"
    )
    repair_logs = relationship(
        "RepairLog", back_populates="device", order_by="RepairLog.checked_in_at.desc()"
    )
