import api from "./api";
import type { LoginRequest, RegisterRequest, Token, User } from "@/types";

export async function login(credentials: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", credentials);
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function register(payload: RegisterRequest): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
