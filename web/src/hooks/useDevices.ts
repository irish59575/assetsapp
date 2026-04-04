"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Device,
  DeviceHistory,
  DeviceAssignPayload,
  DeviceStatus,
  RepairCheckInPayload,
  RepairCheckOutPayload,
} from "@/types";

interface DeviceFilters {
  client_id?: number;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

async function fetchDevices(filters: DeviceFilters = {}): Promise<Device[]> {
  const params: Record<string, string | number> = {};
  if (filters.client_id !== undefined) params.client_id = filters.client_id;
  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;
  if (filters.skip !== undefined) params.skip = filters.skip;
  if (filters.limit !== undefined) params.limit = filters.limit;
  const { data } = await api.get<Device[]>("/devices", { params });
  return data;
}

async function fetchDevice(id: number): Promise<Device> {
  const { data } = await api.get<Device>(`/devices/${id}`);
  return data;
}

async function fetchDeviceHistory(id: number): Promise<DeviceHistory> {
  const { data } = await api.get<DeviceHistory>(`/devices/${id}/history`);
  return data;
}

async function assignDevice(id: number, payload: DeviceAssignPayload): Promise<Device> {
  const { data } = await api.post<Device>(`/devices/${id}/assign`, payload);
  return data;
}

async function unassignDevice(id: number): Promise<Device> {
  const { data } = await api.post<Device>(`/devices/${id}/unassign`);
  return data;
}

async function checkinDevice(id: number, payload: RepairCheckInPayload): Promise<Device> {
  const { data } = await api.post<Device>(`/devices/${id}/checkin`, payload);
  return data;
}

async function checkoutDevice(id: number, payload: RepairCheckOutPayload): Promise<Device> {
  const { data } = await api.post<Device>(`/devices/${id}/checkout`, payload);
  return data;
}

export function useDevices(filters: DeviceFilters = {}) {
  return useQuery<Device[]>({
    queryKey: ["devices", filters],
    queryFn: () => fetchDevices(filters),
    staleTime: 60 * 1000,
  });
}

export function useDevice(id: number) {
  return useQuery<Device>({
    queryKey: ["device", id],
    queryFn: () => fetchDevice(id),
    enabled: !!id,
  });
}

export function useDeviceHistory(id: number) {
  return useQuery<DeviceHistory>({
    queryKey: ["deviceHistory", id],
    queryFn: () => fetchDeviceHistory(id),
    enabled: !!id,
  });
}

export function useAssignDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DeviceAssignPayload }) =>
      assignDevice(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}

export function useUnassignDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unassignDevice(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["device", id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}

export function useCheckinDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RepairCheckInPayload }) =>
      checkinDevice(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}

export function useCheckoutDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RepairCheckOutPayload }) =>
      checkoutDevice(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}

export function useSetDeviceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: DeviceStatus; notes?: string }) =>
      api.post<Device>(`/devices/${id}/set-status`, { status, notes }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["device", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}
