from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_count = Column(Integer, default=0, nullable=False)
    updated_count = Column(Integer, default=0, nullable=False)
    clients_synced = Column(Integer, default=0, nullable=False)
    error = Column(Text, nullable=True)
    source = Column(String(50), default="labtech", nullable=False)
