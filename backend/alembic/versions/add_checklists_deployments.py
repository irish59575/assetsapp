"""add checklist templates, deployments, and pre_provisioning status

Revision ID: add_checklists_deployments
Revises: add_device_status_logs
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "add_checklists_deployments"
down_revision = "add_device_status_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pre_provisioning to devices status column (SQLite: recreate not needed — enum is stored as string)
    # SQLite stores enums as VARCHAR so adding a new value requires no schema change,
    # but we add a check via the application layer.

    op.create_table(
        "checklist_templates",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id"), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "template_steps",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("checklist_templates.id"), nullable=False, index=True),
        sa.Column("order", sa.Integer(), nullable=False, default=0),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("required", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "deployments",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("checklist_templates.id"), nullable=False),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id"), nullable=False, index=True),
        sa.Column("device_id", sa.Integer(), sa.ForeignKey("devices.id"), nullable=True),
        sa.Column("engineer_name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="in_progress"),
        sa.Column("connectwise_ticket", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("serial_number", sa.String(200), nullable=True, index=True),
        sa.Column("device_name", sa.String(255), nullable=True),
        sa.Column("label_code", sa.String(50), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )

    op.create_table(
        "deployment_steps",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("deployment_id", sa.Integer(), sa.ForeignKey("deployments.id"), nullable=False, index=True),
        sa.Column("template_step_id", sa.Integer(), sa.ForeignKey("template_steps.id"), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("required", sa.Boolean(), nullable=False, default=True),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("completed_by", sa.String(255), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("deployment_steps")
    op.drop_table("deployments")
    op.drop_table("template_steps")
    op.drop_table("checklist_templates")
