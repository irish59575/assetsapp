"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    logout();
    queryClient.clear();
    router.push("/login");
  };
}
