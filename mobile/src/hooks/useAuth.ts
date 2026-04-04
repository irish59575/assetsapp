import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { getCurrentUser, login, logout, register } from "@/lib/auth";
import type { LoginRequest, RegisterRequest, User } from "@/types";

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.replace("/(tabs)");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: () => {
      router.replace("/(auth)/login");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
}
