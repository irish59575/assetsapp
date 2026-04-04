import logging
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.api.routes import auth, assets, users, categories, locations
from app.api.routes import clients, devices, sync, labels

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Asset tracking API — track, manage, and scan your physical assets.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(assets.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)
app.include_router(locations.router, prefix=API_PREFIX)
app.include_router(clients.router, prefix=API_PREFIX)
app.include_router(devices.router, prefix=API_PREFIX)
app.include_router(sync.router, prefix=API_PREFIX)
app.include_router(labels.router, prefix=API_PREFIX)

scheduler = BackgroundScheduler()


def sync_labtech_job() -> None:
    from app.core.database import SessionLocal
    from app.services.labtech_sync import sync_labtech

    db = SessionLocal()
    try:
        result = sync_labtech(db)
        logger.info("LabTech sync complete: %s", result)
    except Exception as e:
        logger.error("LabTech sync error: %s", e)
    finally:
        db.close()


@app.on_event("startup")
async def startup() -> None:
    scheduler.add_job(
        sync_labtech_job,
        IntervalTrigger(minutes=15),
        id="labtech_sync",
        replace_existing=True,
    )
    scheduler.add_job(
        sync_labtech_job,
        "date",
        run_date=datetime.now() + timedelta(seconds=10),
        id="labtech_sync_startup",
    )
    scheduler.start()
    logger.info("APScheduler started — LabTech sync scheduled every 15 minutes")


@app.on_event("shutdown")
async def shutdown() -> None:
    scheduler.shutdown()
    logger.info("APScheduler shut down")


@app.get("/", tags=["health"])
def root() -> JSONResponse:
    return JSONResponse({"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION})


@app.get("/health", tags=["health"])
def health() -> JSONResponse:
    return JSONResponse({"status": "healthy"})
