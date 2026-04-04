"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Client, Device } from "@/types";

async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<Client[]>("/clients");
  return data;
}

async function fetchClient(id: number): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

async function fetchClientDevices(id: number, status?: string, search?: string): Promise<Device[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await api.get<Device[]>(`/clients/${id}/devices`, { params });
  return data;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: fetchClients,
    staleTime: 60 * 1000,
  });
}

export function useClient(id: number) {
  return useQuery<Client>({
    queryKey: ["client", id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
  });
}

export function useClientDevices(id: number, status?: string, search?: string) {
  return useQuery<Device[]>({
    queryKey: ["clientDevices", id, status, search],
    queryFn: () => fetchClientDevices(id, status, search),
    enabled: !!id,
  });
}
