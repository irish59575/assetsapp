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
