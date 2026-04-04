import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// In-memory token cache — avoids async SecureStore reads in the request interceptor,
// which can silently fail in React Native environments.
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  _accessToken = access;
  _refreshToken = refresh;
}

export function hasToken(): boolean {
  return !!_accessToken;
}

export async function loadTokensFromStore(): Promise<void> {
  _accessToken = await SecureStore.getItemAsync("access_token");
  _refreshToken = await SecureStore.getItemAsync("refresh_token");
}

export async function clearTokens(): Promise<void> {
  _accessToken = null;
  _refreshToken = null;
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
}

// Synchronous interceptor — token is always in memory
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Append trailing slash to bare collection paths (e.g. /clients, /devices).
  // FastAPI redirects these 307 to /clients/ etc., and Axios strips the
  // Authorization header when following redirects — causing 401.
  if (config.url && /^\/[a-zA-Z0-9_-]+$/.test(config.url)) {
    config.url = config.url + "/";
  }

  if (_accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Handle 401 — try refresh, then redirect to login
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't intercept auth endpoints — let login/register errors pass through
    const url = original?.url ?? "";
    if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: _refreshToken,
          });
          await SecureStore.setItemAsync("access_token", data.access_token);
          await SecureStore.setItemAsync("refresh_token", data.refresh_token);
          setTokens(data.access_token, data.refresh_token);
          if (original.headers) {
            original.headers.Authorization = `Bearer ${data.access_token}`;
          }
          return api(original);
        } catch {
          // Refresh failed — fall through to clear and redirect
        }
      }

      // No refresh token or refresh failed — clear and redirect to login
      await clearTokens();
      const { router } = await import("expo-router");
      router.replace("/(auth)/login");
    }

    return Promise.reject(error);
  }
);

export default api;
