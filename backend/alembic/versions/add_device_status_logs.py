"""add device_status_logs table

Revision ID: add_device_status_logs
Revises: add_qr_labels
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "add_device_status_logs"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "device_status_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("device_id", sa.Integer(), sa.ForeignKey("devices.id"), nullable=False, index=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("changed_by", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("device_status_logs")
