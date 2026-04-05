"""add step_photos table

Revision ID: add_step_photos
Revises: add_checklists_deployments
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "add_step_photos"
down_revision = "add_checklists_deployments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "step_photos",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("deployment_step_id", sa.Integer(), sa.ForeignKey("deployment_steps.id"), nullable=False, index=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("step_photos")
