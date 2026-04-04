from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.sync_log import SyncLog
from app.models.user import User
from app.services.labtech_sync import sync_labtech

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/labtech", response_model=Dict[str, Any])
def trigger_labtech_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Trigger a manual LabTech sync."""
    result = sync_labtech(db)

    # Persist sync result to the log table
    log = SyncLog(
        created_count=result.get("created", 0),
        updated_count=result.get("updated", 0),
        clients_synced=result.get("clients_synced", 0),
        error=result.get("error"),
        source="labtech",
    )
    db.add(log)
    db.commit()

    return result


@router.get("/status", response_model=Dict[str, Any])
def get_sync_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return the last sync time and result."""
    last = (
        db.query(SyncLog)
        .filter(SyncLog.source == "labtech")
        .order_by(SyncLog.synced_at.desc())
        .first()
    )
    if not last:
        return {
            "last_sync_at": None,
            "created": None,
            "updated": None,
            "clients_synced": None,
            "error": None,
        }
    return {
        "last_sync_at": last.synced_at.isoformat(),
        "created": last.created_count,
        "updated": last.updated_count,
        "clients_synced": last.clients_synced,
        "error": last.error,
    }
