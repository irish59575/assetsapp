import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ChecklistTemplate, TemplateCreate } from "@/types";

export function useTemplates(clientId?: number) {
  return useQuery({
    queryKey: ["templates", clientId],
    queryFn: () =>
      api
        .get<ChecklistTemplate[]>("/templates/", { params: clientId ? { client_id: clientId } : {} })
        .then((r) => r.data),
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ["templates", "detail", id],
    queryFn: () => api.get<ChecklistTemplate>(`/templates/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TemplateCreate) =>
      api.post<ChecklistTemplate>("/templates/", body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["templates", data.client_id] });
    },
  });
}

export function useUpdateTemplate(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<TemplateCreate>) =>
      api.put<ChecklistTemplate>(`/templates/${id}`, body).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["templates", data.client_id] });
      qc.invalidateQueries({ queryKey: ["templates", "detail", id] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
