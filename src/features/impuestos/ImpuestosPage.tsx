import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useImpuestos, useDesactivarImpuesto } from "./useImpuestos";
import type { ImpuestoConEspecialista } from "./types";
import { Search, Trash2, Plus, Edit2, Eye } from "lucide-react";
import { ImpuestoForm } from "./ImpuestoForm";
import { AlertNotification } from "../../components/ui/AlertNotification";
import { useNavigate } from "react-router-dom";

export const ImpuestosPage = () => {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  // Gestión de estado global asíncrono administrado por TanStack Query
  const { data: impuestos = [], isLoading, error } = useImpuestos();
  const desactivarMutation = useDesactivarImpuesto();

  const [showForm, setShowForm] = useState(false);
  const [impuestoEditando, setImpuestoEditando] =
    useState<ImpuestoConEspecialista | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de desactivar este impuesto? No afectará a los vencimientos ya generados, pero no se podrá asignar a clientes nuevos.",
      )
    ) {
      desactivarMutation.mutate(id, {
        onError: (err: any) => {
          setErrorLocal(
            err.message ||
              "Fallo de persistencia al intentar desactivar el impuesto.",
          );
        },
        onSuccess: () => {
          setErrorLocal(null);
        },
      });
    }
  };

  const handleEdit = (impuesto: ImpuestoConEspecialista) => {
    setImpuestoEditando(impuesto);
    setShowForm(true);
  };

  const handleCreate = () => {
    setImpuestoEditando(null);
    setShowForm(true);
  };

  const impuestosFiltrados = impuestos.filter(
    (i) =>
      i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.periodicidad.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const errorAMostrar = error?.message || errorLocal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Catálogo de Impuestos
          </h1>
          <p className="text-text-muted">
            Configuración de obligaciones, periodicidades y responsables.
          </p>
        </div>

        {puedeAdministrar && (
          <button
            onClick={handleCreate}
            className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Nuevo Impuesto
          </button>
        )}
      </div>

      {errorAMostrar && (
        <div className="animate-in fade-in duration-200 max-w-4xl">
          <AlertNotification
            type="error"
            title="Error de Catálogo"
            message={errorAMostrar}
            onClose={() => setErrorLocal(null)}
          />
        </div>
      )}

      <div className="card-container !p-0 overflow-hidden bg-surface border border-gray-200 rounded-xl shadow-xs">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o periodicidad..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Obligación</th>
                <th className="px-6 py-4 font-semibold">Regla de Cálculo</th>
                <th className="px-6 py-4 font-semibold">
                  Especialista (Opcional)
                </th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase tracking-wider animate-pulse"
                  >
                    Cargando catálogo...
                  </td>
                </tr>
              ) : impuestosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-muted italic text-xs"
                  >
                    No hay impuestos configurados.
                  </td>
                </tr>
              ) : (
                impuestosFiltrados.map((impuesto) => (
                  <tr
                    key={impuesto.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div
                        onClick={() => navigate(`/impuestos/${impuesto.id}`)}
                        className="flex flex-col cursor-pointer group"
                      >
                        <span className="font-semibold text-primary group-hover:text-accent transition-colors">
                          {impuesto.nombre}
                        </span>
                        <span className="text-xs text-text-muted font-mono bg-gray-100 w-fit px-1.5 py-0.5 rounded mt-1">
                          {impuesto.periodicidad}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-main font-medium">
                        {impuesto.regla_vencimiento.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted font-medium">
                        {impuesto.usuarios?.nombre_completo || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          impuesto.estado === "ACTIVO"
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            impuesto.estado === "ACTIVO"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        />
                        {impuesto.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/impuestos/${impuesto.id}`)}
                          className="text-text-muted hover:text-accent p-2 transition-colors cursor-pointer"
                          title="Ver Calendario Base Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {puedeAdministrar && (
                          <>
                            <button
                              onClick={() => handleEdit(impuesto)}
                              className="text-text-muted hover:text-accent p-2 transition-colors cursor-pointer"
                              title="Editar impuesto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(impuesto.id)}
                              disabled={desactivarMutation.isPending}
                              className="text-text-muted hover:text-danger p-2 transition-colors cursor-pointer disabled:opacity-30"
                              title="Desactivar impuesto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ImpuestoForm
          impuestoAEditar={impuestoEditando}
          onClose={() => {
            setShowForm(false);
            setImpuestoEditando(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setImpuestoEditando(null);
          }}
        />
      )}
    </div>
  );
};
