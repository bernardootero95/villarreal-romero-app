import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosService } from "./usuariosService";
import type { UsuarioFormData } from "./types";

export const USUARIOS_QUERY_KEY = ["usuarios"] as const;

export const getUsuariosQueryKey = () => USUARIOS_QUERY_KEY;

export const useUsuarios = () => {
  return useQuery({
    queryKey: getUsuariosQueryKey(),
    queryFn: usuariosService.getAll,
    staleTime: 1000 * 60 * 5, 
  });
};


export const useCreateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: UsuarioFormData) => usuariosService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsuariosQueryKey() });
    },
  });
};

interface UpdateUsuarioParams {
  id: string;
  payload: UsuarioFormData;
}


export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateUsuarioParams) => usuariosService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsuariosQueryKey() });
    },
  });
};

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usuariosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsuariosQueryKey() });
    },
  });
};

interface ForcePasswordParams {
  usuarioId: string;
  nuevaClave: string;
}


export const useForzarPassword = () => {
  return useMutation({
    mutationFn: ({ usuarioId, nuevaClave }: ForcePasswordParams) =>
      usuariosService.forzarCambioPassword(usuarioId, nuevaClave),
  });
};