import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { QRLabel } from "@/types";

async function fetchLabel(labelCode: string): Promise<QRLabel> {
  const { data } = await api.get<QRLabel>(`/labels/${encodeURIComponent(labelCode)}`);
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

export function useLabel(labelCode: string | null) {
  return useQuery<QRLabel>({
    queryKey: ["label", labelCode],
    queryFn: () => fetchLabel(labelCode!),
    enabled: !!labelCode,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ["label", variables.labelCode] });
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["device", variables.device_id] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useUnassignLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (labelCode: string) => unassignLabel(labelCode),
    onSuccess: (_data, labelCode) => {
      queryClient.invalidateQueries({ queryKey: ["label", labelCode] });
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
