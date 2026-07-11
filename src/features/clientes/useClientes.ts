import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesService } from "./clientesService";
import { clienteImpuestosService } from "./clienteImpuestosService";
import type { ClienteFormData } from "./types";

// Claves de caché (Query Keys) semánticas para modular el estado global
export const CLIENTES_KEY = ["clientes"] as const;
export const CLIENTE_IMPUESTOS_KEY = ["cliente-impuestos"] as const;

export const getClientesQueryKey = () => CLIENTES_KEY;
export const getClienteImpuestosQueryKey = (clienteId: string) => [...CLIENTE_IMPUESTOS_KEY, clienteId] as const;

/**
 * Hook para consultar todos los clientes y sus contadores responsables asignados
 */
export const useClientes = () => {
  return useQuery({
    queryKey: getClientesQueryKey(),
    queryFn: () => clientesService.getAll(),
    staleTime: 1000 * 60 * 5, // Consideramos los clientes frescos por 5 minutos
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
      queryClient.invalidateQueries({ queryKey: getClientesQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getClientesQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getClientesQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getClientesQueryKey() });
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
  ultimoDigitoNit: number;
}

/**
 * Hook para vincular un impuesto a un cliente y disparar la agenda de vencimientos automática
 */
export const useAsignarImpuesto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clienteId, impuestoId, ultimoDigitoNit }: AsignarImpuestoParams) =>
      clienteImpuestosService.asignarImpuesto(clienteId, impuestoId, ultimoDigitoNit),
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
  ultimoDigitoMapa: Record<string, number>;
}

/**
 * Hook para vincular obligaciones e inyectar cronogramas masivos en lote
 */
export const useAsignarImpuestosBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ obligaciones, ultimoDigitoMapa }: AsignarImpuestosBulkParams) =>
      clienteImpuestosService.asignarImpuestosBulk(obligaciones, ultimoDigitoMapa),
    onSuccess: () => {
      // Invalida toda la jerarquía de asignaciones y agendas temporales
      queryClient.invalidateQueries({ queryKey: CLIENTE_IMPUESTOS_KEY });
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
};