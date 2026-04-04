from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    devices_created = Column(Integer, default=0, nullable=False)
    devices_updated = Column(Integer, default=0, nullable=False)
    clients_synced = Column(Integer, default=0, nullable=False)
    error = Column(Text, nullable=True)
