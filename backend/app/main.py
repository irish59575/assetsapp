from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, assets, users, categories, locations
from app.api.routes import clients, devices, sync

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


@app.get("/", tags=["health"])
def root() -> JSONResponse:
    return JSONResponse({"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION})


@app.get("/health", tags=["health"])
def health() -> JSONResponse:
    return JSONResponse({"status": "healthy"})
