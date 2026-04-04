"""add qr_labels table

Revision ID: a1b2c3d4e5f6
Revises: 71eab0e4c68b
Create Date: 2026-04-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '71eab0e4c68b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TS = sa.text('CURRENT_TIMESTAMP')


def upgrade() -> None:
    op.create_table(
        'qr_labels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('label_code', sa.String(length=20), nullable=False),
        sa.Column(
            'status',
            sa.String(length=20),
            nullable=False,
            server_default='unassigned',
        ),
        sa.Column('device_id', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.Column('assigned_by', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('label_code'),
        sa.UniqueConstraint('device_id'),
    )
    op.create_index(op.f('ix_qr_labels_id'), 'qr_labels', ['id'], unique=False)
    op.create_index(op.f('ix_qr_labels_label_code'), 'qr_labels', ['label_code'], unique=True)
    op.create_index(op.f('ix_qr_labels_status'), 'qr_labels', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_qr_labels_status'), table_name='qr_labels')
    op.drop_index(op.f('ix_qr_labels_label_code'), table_name='qr_labels')
    op.drop_index(op.f('ix_qr_labels_id'), table_name='qr_labels')
    op.drop_table('qr_labels')
