"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { QRLabel } from "@/types";

interface LabelFilters {
  status?: string;
  skip?: number;
  limit?: number;
}

async function fetchLabels(filters: LabelFilters = {}): Promise<QRLabel[]> {
  const params: Record<string, string | number> = {};
  if (filters.status) params.status = filters.status;
  if (filters.skip !== undefined) params.skip = filters.skip;
  if (filters.limit !== undefined) params.limit = filters.limit;
  const { data } = await api.get<QRLabel[]>("/labels", { params });
  return data;
}

async function fetchLabel(labelCode: string): Promise<QRLabel> {
  const { data } = await api.get<QRLabel>(`/labels/${encodeURIComponent(labelCode)}`);
  return data;
}

async function generateLabels(payload: {
  count: number;
  prefix?: string;
  start_from?: number;
}): Promise<QRLabel[]> {
  const { data } = await api.post<QRLabel[]>("/labels/generate", payload);
  return data;
}

async function assignLabel(
  labelCode: string,
  payload: { device_id: number; assigned_by: string }
): Promise<QRLabel> {
  const { data } = await api.post<QRLabel>(
    `/labels/${encodeURIComponent(labelCode)}/assign`,
    payload
  );
  return data;
}

async function unassignLabel(labelCode: string): Promise<QRLabel> {
  const { data } = await api.post<QRLabel>(
    `/labels/${encodeURIComponent(labelCode)}/unassign`
  );
  return data;
}

async function fetchPrintLabels(count: number, start_code?: string): Promise<string[]> {
  const params: Record<string, string | number> = { count };
  if (start_code) params.start_code = start_code;
  const { data } = await api.get<string[]>("/labels/print", { params });
  return data;
}

export function useLabels(filters: LabelFilters = {}) {
  return useQuery<QRLabel[]>({
    queryKey: ["labels", filters],
    queryFn: () => fetchLabels(filters),
    staleTime: 30 * 1000,
  });
}

export function useLabel(labelCode: string | null) {
  return useQuery<QRLabel>({
    queryKey: ["label", labelCode],
    queryFn: () => fetchLabel(labelCode!),
    enabled: !!labelCode,
    retry: false,
  });
}

export function usePrintLabels(count: number, startCode?: string) {
  return useQuery<string[]>({
    queryKey: ["labelsPrint", count, startCode],
    queryFn: () => fetchPrintLabels(count, startCode),
    staleTime: 60 * 1000,
  });
}

export function useGenerateLabels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { count: number; prefix?: string; start_from?: number }) =>
      generateLabels(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["labelsPrint"] });
    },
  });
}

export function useAssignLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      labelCode,
      device_id,
      assigned_by,
    }: {
      labelCode: string;
      device_id: number;
      assigned_by: string;
    }) => assignLabel(labelCode, { device_id, assigned_by }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["label", variables.labelCode] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}

export function useUnassignLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelCode: string) => unassignLabel(labelCode),
    onSuccess: (_data, labelCode) => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["label", labelCode] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["clientDevices"] });
    },
  });
}
