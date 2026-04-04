"""initial migration

Revision ID: 71eab0e4c68b
Revises:
Create Date: 2026-04-03 11:42:05.124703

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71eab0e4c68b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TS = sa.text('CURRENT_TIMESTAMP')


def upgrade() -> None:
    op.create_table('categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('color', sa.String(length=7), nullable=False),
    sa.Column('icon', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    op.create_table('locations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('address', sa.String(length=500), nullable=True),
    sa.Column('building', sa.String(length=100), nullable=True),
    sa.Column('floor', sa.String(length=50), nullable=True),
    sa.Column('room', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_locations_id'), 'locations', ['id'], unique=False)
    op.create_index(op.f('ix_locations_name'), 'locations', ['name'], unique=False)

    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=255), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_superuser', sa.Boolean(), nullable=False),
    sa.Column('avatar_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    op.create_table('assets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('serial_number', sa.String(length=200), nullable=True),
    sa.Column('purchase_price', sa.String(length=50), nullable=True),
    sa.Column('purchase_date', sa.DateTime(), nullable=True),
    sa.Column('category_id', sa.Integer(), nullable=True),
    sa.Column('location_id', sa.Integer(), nullable=True),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('qr_code', sa.String(length=500), nullable=True),
    sa.Column('barcode', sa.String(length=200), nullable=True),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
    sa.ForeignKeyConstraint(['location_id'], ['locations.id'], ),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assets_id'), 'assets', ['id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)
    op.create_index(op.f('ix_assets_serial_number'), 'assets', ['serial_number'], unique=False)

    op.create_table('clients',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('labtech_client_id', sa.String(length=100), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('labtech_client_id')
    )
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)

    op.create_table('devices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('labtech_id', sa.String(length=100), nullable=True),
    sa.Column('device_name', sa.String(length=255), nullable=False),
    sa.Column('serial_number', sa.String(length=255), nullable=True),
    sa.Column('manufacturer', sa.String(length=255), nullable=True),
    sa.Column('model', sa.String(length=255), nullable=True),
    sa.Column('os_version', sa.String(length=255), nullable=True),
    sa.Column('ip_address', sa.String(length=50), nullable=True),
    sa.Column('ram_gb', sa.Float(), nullable=True),
    sa.Column('disk_gb', sa.Float(), nullable=True),
    sa.Column('last_logged_in_user', sa.String(length=255), nullable=True),
    sa.Column('last_logged_in_at', sa.DateTime(), nullable=True),
    sa.Column('last_seen_at', sa.DateTime(), nullable=True),
    sa.Column('client_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
    sa.Column('assigned_to', sa.String(length=255), nullable=True),
    sa.Column('assigned_at', sa.DateTime(), nullable=True),
    sa.Column('assigned_by', sa.String(length=255), nullable=True),
    sa.Column('qr_code', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_devices_id'), 'devices', ['id'], unique=False)
    op.create_index(op.f('ix_devices_labtech_id'), 'devices', ['labtech_id'], unique=True)
    op.create_index(op.f('ix_devices_device_name'), 'devices', ['device_name'], unique=False)

    op.create_table('device_assignments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('device_id', sa.Integer(), nullable=False),
    sa.Column('assigned_to', sa.String(length=255), nullable=False),
    sa.Column('assigned_by', sa.String(length=255), nullable=False),
    sa.Column('assigned_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('returned_at', sa.DateTime(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_device_assignments_id'), 'device_assignments', ['id'], unique=False)

    op.create_table('repair_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('device_id', sa.Integer(), nullable=False),
    sa.Column('checked_in_by', sa.String(length=255), nullable=False),
    sa.Column('checked_in_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('checked_out_at', sa.DateTime(), nullable=True),
    sa.Column('checked_out_by', sa.String(length=255), nullable=True),
    sa.Column('issue_description', sa.Text(), nullable=False),
    sa.Column('resolution_notes', sa.Text(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_repair_logs_id'), 'repair_logs', ['id'], unique=False)

    op.create_table('sync_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('synced_at', sa.DateTime(), server_default=TS, nullable=False),
    sa.Column('devices_created', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('devices_updated', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('clients_synced', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('error', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('sync_logs')
    op.drop_index(op.f('ix_repair_logs_id'), table_name='repair_logs')
    op.drop_table('repair_logs')
    op.drop_index(op.f('ix_device_assignments_id'), table_name='device_assignments')
    op.drop_table('device_assignments')
    op.drop_index(op.f('ix_devices_device_name'), table_name='devices')
    op.drop_index(op.f('ix_devices_labtech_id'), table_name='devices')
    op.drop_index(op.f('ix_devices_id'), table_name='devices')
    op.drop_table('devices')
    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_index(op.f('ix_clients_id'), table_name='clients')
    op.drop_table('clients')
    op.drop_index(op.f('ix_assets_serial_number'), table_name='assets')
    op.drop_index(op.f('ix_assets_name'), table_name='assets')
    op.drop_index(op.f('ix_assets_id'), table_name='assets')
    op.drop_table('assets')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_locations_name'), table_name='locations')
    op.drop_index(op.f('ix_locations_id'), table_name='locations')
    op.drop_table('locations')
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
