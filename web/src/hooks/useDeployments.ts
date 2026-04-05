import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Deployment,
  DeploymentCreate,
  DeploymentUpdatePayload,
  DeploymentStepUpdatePayload,
} from "@/types";

export function useDeployments(clientId?: number, status?: string) {
  return useQuery({
    queryKey: ["deployments", clientId, status],
    queryFn: () =>
      api
        .get<Deployment[]>("/deployments/", {
          params: {
            ...(clientId ? { client_id: clientId } : {}),
            ...(status ? { status } : {}),
          },
        })
        .then((r) => r.data),
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: ["deployments", "detail", id],
    queryFn: () => api.get<Deployment>(`/deployments/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeploymentCreate) =>
      api.post<Deployment>("/deployments/", body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["deployments", data.client_id] });
    },
  });
}

export function useUpdateDeployment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeploymentUpdatePayload) =>
      api.patch<Deployment>(`/deployments/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deployments", "detail", id] });
    },
  });
}

export function useUpdateDeploymentStep(deploymentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, body }: { stepId: number; body: DeploymentStepUpdatePayload }) =>
      api
        .patch<Deployment>(`/deployments/${deploymentId}/steps/${stepId}`, body)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deployments", "detail", deploymentId] });
    },
  });
}

export function useCompleteDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Deployment>(`/deployments/${id}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["deployments", "detail", data.id] });
      qc.invalidateQueries({ queryKey: ["deployments", data.client_id] });
    },
  });
}

export function useCancelDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Deployment>(`/deployments/${id}/cancel`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["deployments", "detail", data.id] });
      qc.invalidateQueries({ queryKey: ["deployments", data.client_id] });
    },
  });
}

export function useDeleteDeployment(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/deployments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deployments", clientId] });
    },
  });
}
