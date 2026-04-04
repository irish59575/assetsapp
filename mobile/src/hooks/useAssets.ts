import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Asset, AssetCreate } from "@/types";

async function fetchAssets(search?: string): Promise<Asset[]> {
  const { data } = await api.get<Asset[]>("/assets", {
    params: { limit: 50, ...(search ? { search } : {}) },
  });
  return data;
}

async function fetchAsset(id: number): Promise<Asset> {
  const { data } = await api.get<Asset>(`/assets/${id}`);
  return data;
}

async function fetchAssetByScan(qrData: string): Promise<Asset> {
  const { data } = await api.get<Asset>(`/assets/scan/${encodeURIComponent(qrData)}`);
  return data;
}

export function useAssets(search?: string) {
  return useQuery<Asset[]>({
    queryKey: ["assets", search],
    queryFn: () => fetchAssets(search),
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

export function useAssetByScan(qrData: string | null) {
  return useQuery<Asset>({
    queryKey: ["assetScan", qrData],
    queryFn: () => fetchAssetByScan(qrData!),
    enabled: !!qrData,
    retry: false,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetCreate) => api.post<Asset>("/assets", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
