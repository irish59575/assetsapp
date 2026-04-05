import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DeploymentStatus(str, enum.Enum):
    in_progress = "in_progress"
    complete = "complete"
    cancelled = "cancelled"


class DeploymentStepStatus(str, enum.Enum):
    pending = "pending"
    done = "done"
    skipped = "skipped"
    na = "na"


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("checklist_templates.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    # Linked once pre-provisioned device is created or LabTech syncs
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    engineer_name = Column(String(255), nullable=False)
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.in_progress, nullable=False)
    connectwise_ticket = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    # Pre-provisioning fields — filled in during the deployment before LabTech knows about it
    serial_number = Column(String(200), nullable=True, index=True)
    device_name = Column(String(255), nullable=True)
    label_code = Column(String(50), nullable=True)  # QR label attached during build

    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    template = relationship("ChecklistTemplate", backref="deployments")
    client = relationship("Client", backref="deployments")
    device = relationship("Device", backref="deployments")
    steps = relationship(
        "DeploymentStep",
        backref="deployment",
        order_by="DeploymentStep.order",
        cascade="all, delete-orphan",
    )


class DeploymentStep(Base):
    __tablename__ = "deployment_steps"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), nullable=False, index=True)
    template_step_id = Column(Integer, ForeignKey("template_steps.id"), nullable=True)
    order = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    status = Column(
        Enum(DeploymentStepStatus),
        default=DeploymentStepStatus.pending,
        nullable=False,
    )
    notes = Column(Text, nullable=True)
    completed_by = Column(String(255), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    photos = relationship("StepPhoto", backref="step", cascade="all, delete-orphan")


class StepPhoto(Base):
    __tablename__ = "step_photos"

    id = Column(Integer, primary_key=True, index=True)
    deployment_step_id = Column(Integer, ForeignKey("deployment_steps.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
