import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { clientesService, type ClientesQueryParams } from "./clientesService";
import { clienteImpuestosService } from "./clienteImpuestosService";
import type { ClienteFormData } from "./types";

// Claves de caché (Query Keys) semánticas para modular el estado global
export const CLIENTES_KEY = ["clientes"] as const;
export const CLIENTE_IMPUESTOS_KEY = ["cliente-impuestos"] as const;

export const getClientesQueryKey = (params: ClientesQueryParams) => [...CLIENTES_KEY, "lista", params] as const;
export const getClienteQueryKey = (id: string) => [...CLIENTES_KEY, "detalle", id] as const;
export const getMisClientesQueryKey = (contadorId: string) => [...CLIENTES_KEY, "mis-clientes", contadorId] as const;
export const getClienteImpuestosQueryKey = (clienteId: string) => [...CLIENTE_IMPUESTOS_KEY, clienteId] as const;

/**
 * Hook para consultar una página del directorio de clientes (búsqueda y filtro por
 * responsable resueltos en el servidor, no en memoria).
 */
export const useClientes = (params: ClientesQueryParams) => {
  return useQuery({
    queryKey: getClientesQueryKey(params),
    queryFn: () => clientesService.getAll(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData, // evita el parpadeo de "cargando" al cambiar de página
  });
};

/**
 * Hook para consultar un único cliente por id (ficha de detalle).
 */
export const useCliente = (id: string | undefined) => {
  return useQuery({
    queryKey: getClienteQueryKey(id || ""),
    queryFn: () => clientesService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook para consultar todos los clientes activos asignados a un contador puntual
 * (widget "Mis Empresas Asignadas" en PerfilPage).
 */
export const useMisClientes = (contadorId: string | undefined) => {
  return useQuery({
    queryKey: getMisClientesQueryKey(contadorId || ""),
    queryFn: () => clientesService.getMisClientes(contadorId!),
    enabled: !!contadorId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook para registrar un nuevo cliente en el sistema
 */
export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: ClienteFormData) => clientesService.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
};

interface UpdateClienteParams {
  id: string;
  payload: ClienteFormData;
}

/**
 * Hook para actualizar los datos demográficos o contractuales de un cliente
 */
export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateClienteParams) => clientesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
};

/**
 * Hook para realizar el borrado lógico de un cliente (Inactiva y añade timestamp)
 */
export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
};

/**
 * Hook para la inyección masiva en lote de clientes (Estructuras XLSX)
 */
export const useCreateBulkClientes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientes: Array<ClienteFormData & { dv: number }>) => clientesService.createBulk(clientes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTES_KEY });
    },
  });
};

// ==========================================
// HOOKS DE CONTROL DE IMPUESTOS POR CLIENTE
// ==========================================

/**
 * Hook para listar las obligaciones tributarias activas de un cliente específico
 */
export const useClienteImpuestos = (clienteId: string) => {
  return useQuery({
    queryKey: getClienteImpuestosQueryKey(clienteId),
    queryFn: () => clienteImpuestosService.getImpuestosPorCliente(clienteId),
    enabled: !!clienteId, // Evita llamadas con IDs indefinidos en modales colapsados
  });
};

interface AsignarImpuestoParams {
  clienteId: string;
  impuestoId: string;
}

/**
 * Hook para vincular un impuesto a un cliente y disparar la agenda de vencimientos automática
 */
export const useAsignarImpuesto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clienteId, impuestoId }: AsignarImpuestoParams) =>
      clienteImpuestosService.asignarImpuesto(clienteId, impuestoId),
    onSuccess: (_data, variables) => {
      // Invalida la lista de obligaciones del cliente para forzar el re-render en la UI
      queryClient.invalidateQueries({ queryKey: getClienteImpuestosQueryKey(variables.clienteId) });
      // Opcional: Si tienes una query global de "vencimientos", puedes invalidarla aquí también
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
};

interface DesasignarImpuestoParams {
  asignacionId: string;
  clienteId: string;
  impuestoId: string;
}

/**
 * Hook para desvincular una obligación tributaria y purgar tareas PENDIENTES generadas en cascada
 */
export const useDesasignarImpuesto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ asignacionId, clienteId, impuestoId }: DesasignarImpuestoParams) =>
      clienteImpuestosService.desasignarImpuesto(asignacionId, clienteId, impuestoId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getClienteImpuestosQueryKey(variables.clienteId) });
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
};

interface AsignarImpuestosBulkParams {
  obligaciones: Array<{ cliente_id: string; impuesto_id: string; estado: string }>;
}

/**
 * Hook para vincular obligaciones e inyectar cronogramas masivos en lote
 */
export const useAsignarImpuestosBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ obligaciones }: AsignarImpuestosBulkParams) =>
      clienteImpuestosService.asignarImpuestosBulk(obligaciones),
    onSuccess: () => {
      // Invalida toda la jerarquía de asignaciones y agendas temporales
      queryClient.invalidateQueries({ queryKey: CLIENTE_IMPUESTOS_KEY });
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
};