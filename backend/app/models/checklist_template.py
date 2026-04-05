import enum
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ChecklistTemplate(Base):
    __tablename__ = "checklist_templates"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    client = relationship("Client", backref="checklist_templates")
    steps = relationship(
        "TemplateStep",
        backref="template",
        order_by="TemplateStep.order",
        cascade="all, delete-orphan",
    )


class TemplateStep(Base):
    __tablename__ = "template_steps"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("checklist_templates.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False, default=0)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
