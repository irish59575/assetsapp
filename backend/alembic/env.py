import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Load .env so DATABASE_URL is available
load_dotenv()

# Add backend root to path so app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base  # noqa: E402
# Import all models so Alembic detects them
import app.models  # noqa: F401, E402
from app.models.user import User  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.location import Location  # noqa: F401
from app.models.asset import Asset  # noqa: F401
from app.models.client import Client  # noqa: F401
from app.models.device import Device  # noqa: F401
from app.models.device_assignment import DeviceAssignment  # noqa: F401
from app.models.repair_log import RepairLog  # noqa: F401
from app.models.sync_log import SyncLog  # noqa: F401

config = context.config

# Override sqlalchemy.url with DATABASE_URL from environment
database_url = os.environ.get("DATABASE_URL", "sqlite:///./assets.db")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
