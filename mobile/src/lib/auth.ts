import * as SecureStore from "expo-secure-store";
import api, { setTokens, clearTokens, loadTokensFromStore, hasToken } from "./api";
import type { LoginRequest, RegisterRequest, Token, User } from "@/types";

export async function login(credentials: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", credentials);
  await SecureStore.setItemAsync("access_token", data.access_token);
  await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(payload: RegisterRequest): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function logout(): Promise<void> {
  await clearTokens();
}

export async function isAuthenticated(): Promise<boolean> {
  if (hasToken()) return true;
  // Not in memory (e.g. app restart) — load from SecureStore
  await loadTokensFromStore();
  return hasToken();
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}
