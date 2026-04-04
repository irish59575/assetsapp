// ---- Existing types (kept for backward compat) ----

export type AssetStatus = "active" | "inactive" | "maintenance" | "disposed" | "lost";

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
}

export interface Location {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
}

export interface Asset {
  id: number;
  name: string;
  description: string | null;
  serial_number: string | null;
  purchase_price: string | null;
  purchase_date: string | null;
  category_id: number | null;
  location_id: number | null;
  owner_id: number;
  qr_code: string | null;
  barcode: string | null;
  image_url: string | null;
  status: AssetStatus;
  category_rel: Pick<Category, "id" | "name" | "color"> | null;
  location_rel: Pick<Location, "id" | "name"> | null;
  created_at: string;
  updated_at: string;
}

export interface AssetCreate {
  name: string;
  description?: string;
  serial_number?: string;
  purchase_price?: string;
  category_id?: number;
  location_id?: number;
  barcode?: string;
  image_url?: string;
  status?: AssetStatus;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

// ---- New MSP laptop management types ----

export type DeviceStatus = "available" | "assigned" | "in_repair" | "retired";
export type RepairStatus = "open" | "resolved";

export interface Client {
  id: number;
  name: string;
  labtech_client_id: string | null;
  device_count: number;
  assigned: number;
  available: number;
  in_repair: number;
  created_at: string;
  updated_at: string;
}

export type LabelStatus = "unassigned" | "assigned" | "retired";

export interface QRLabel {
  id: number;
  label_code: string;
  status: LabelStatus;
  device_id: number | null;
  device?: Device;
  assigned_at: string | null;
  assigned_by: string | null;
}

export interface Device {
  id: number;
  labtech_id: string | null;
  device_name: string;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  os_version: string | null;
  ip_address: string | null;
  ram_gb: number | null;
  disk_gb: number | null;
  last_logged_in_user: string | null;
  last_logged_in_at: string | null;
  last_seen_at: string | null;
  client_id: number | null;
  client_name: string | null;
  status: DeviceStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  qr_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceAssignment {
  id: number;
  device_id: number;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  returned_at: string | null;
  notes: string | null;
}

export interface RepairLog {
  id: number;
  device_id: number;
  checked_in_by: string;
  checked_in_at: string;
  checked_out_at: string | null;
  checked_out_by: string | null;
  issue_description: string;
  resolution_notes: string | null;
  status: RepairStatus;
}

export interface DeviceHistory {
  assignments: DeviceAssignment[];
  repair_logs: RepairLog[];
}

export interface DeviceAssignPayload {
  assigned_to: string;
  assigned_by: string;
  notes?: string;
}

export interface RepairCheckInPayload {
  checked_in_by: string;
  issue_description: string;
}

export interface RepairCheckOutPayload {
  checked_out_by: string;
  resolution_notes?: string;
}
