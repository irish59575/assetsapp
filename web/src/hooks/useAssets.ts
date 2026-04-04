"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Asset, AssetCreate, AssetUpdate } from "@/types";

interface AssetFilters {
  search?: string;
  status?: string;
  category_id?: number;
  location_id?: number;
  skip?: number;
  limit?: number;
}

async function fetchAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets", { params: filters });
  return data;
}

async function fetchAsset(id: number): Promise<Asset> {
  const { data } = await api.get<Asset>(`/assets/${id}`);
  return data;
}

async function createAsset(payload: AssetCreate): Promise<Asset> {
  const { data } = await api.post<Asset>("/assets", payload);
  return data;
}

async function updateAsset(id: number, payload: AssetUpdate): Promise<Asset> {
  const { data } = await api.put<Asset>(`/assets/${id}`, payload);
  return data;
}

async function deleteAsset(id: number): Promise<void> {
  await api.delete(`/assets/${id}`);
}

export function useAssets(filters: AssetFilters = {}) {
  return useQuery<Asset[]>({
    queryKey: ["assets", filters],
    queryFn: () => fetchAssets(filters),
    staleTime: 60 * 1000,
  });
}

export function useAsset(id: number) {
  return useQuery<Asset>({
    queryKey: ["asset", id],
    queryFn: () => fetchAsset(id),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetCreate) => createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetUpdate) => updateAsset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
