import * as SecureStore from "expo-secure-store";
import api from "./api";
import type { LoginRequest, RegisterRequest, Token, User } from "@/types";

export async function login(credentials: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", credentials);
  await SecureStore.setItemAsync("access_token", data.access_token);
  await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  return data;
}

export async function register(payload: RegisterRequest): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync("access_token");
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
