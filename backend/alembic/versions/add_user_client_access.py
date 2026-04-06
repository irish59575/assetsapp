"""add user_client_access table and user admin fields

Revision ID: add_user_client_access
Revises: add_step_photos
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa

revision = "add_user_client_access"
down_revision = "add_step_photos"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_client_access",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.UniqueConstraint("user_id", "client_id", name="uq_user_client"),
    )


def downgrade() -> None:
    op.drop_table("user_client_access")
