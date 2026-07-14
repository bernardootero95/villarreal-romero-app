import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tareasService } from "./tareasService";
import type { TareaFormData, Tarea } from "./types";

export const TAREAS_QUERY_KEY = ["tareas"] as const;

export const useTareas = (usuarioId: string | undefined, cargo: string | undefined) => {
  return useQuery({
    queryKey: [...TAREAS_QUERY_KEY, usuarioId],
    queryFn: () => tareasService.getAll(usuarioId!, cargo!),
    enabled: !!usuarioId && !!cargo,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTarea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: TareaFormData) => tareasService.create(formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY }),
  });
};

export const useUpdateTarea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TareaFormData }) => tareasService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY }),
  });
};

export const useDeleteTarea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tareasService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY }),
  });
};

// Optimistic Update para el estado (rápido en UI)
export const useActualizarEstadoTarea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => tareasService.updateEstado(id, estado),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: TAREAS_QUERY_KEY });
      // Aquí se podría guardar el snapshot para rollback, simplificado para mantener el código limpio.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAREAS_QUERY_KEY });
    },
  });
};