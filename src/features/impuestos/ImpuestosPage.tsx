import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { impuestosService } from "./impuestosService";
import type { ImpuestoConEspecialista } from "./types";
import { Search, Trash2, Plus, Edit2 } from "lucide-react";
import { ImpuestoForm } from "./ImpuestoForm";

export const ImpuestosPage = () => {
  const { perfil } = useAuth();
  const [impuestos, setImpuestos] = useState<ImpuestoConEspecialista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [impuestoEditando, setImpuestoEditando] =
    useState<ImpuestoConEspecialista | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const fetchImpuestos = async () => {
    try {
      setLoading(true);
      const data = await impuestosService.getAll();
      setImpuestos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpuestos();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de desactivar este impuesto? No afectará a los vencimientos ya generados, pero no se podrá asignar a clientes nuevos.",
      )
    ) {
      try {
        await impuestosService.delete(id);
        fetchImpuestos();
      } catch (error) {
        alert("Error al desactivar el impuesto");
      }
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
            className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Impuesto
          </button>
        )}
      </div>

      <div className="card-container !p-0 overflow-hidden">
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
                {puedeAdministrar && (
                  <th className="px-6 py-4 font-semibold text-right">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={puedeAdministrar ? 5 : 4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    Cargando catálogo...
                  </td>
                </tr>
              ) : impuestosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeAdministrar ? 5 : 4}
                    className="px-6 py-8 text-center text-text-muted"
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
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">
                          {impuesto.nombre}
                        </span>
                        <span className="text-xs text-text-muted font-mono bg-gray-100 w-fit px-1.5 rounded mt-1">
                          {impuesto.periodicidad}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-main">
                        {impuesto.regla_vencimiento.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">
                        {impuesto.usuarios?.nombre_completo || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${impuesto.estado === "ACTIVO" ? "text-success" : "text-danger"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${impuesto.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
                        />
                        {impuesto.estado}
                      </span>
                    </td>
                    {puedeAdministrar && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(impuesto)}
                            className="text-text-muted hover:text-accent p-2 transition-colors"
                            title="Editar impuesto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(impuesto.id)}
                            className="text-text-muted hover:text-danger p-2 transition-colors"
                            title="Desactivar impuesto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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
            fetchImpuestos();
          }}
        />
      )}
    </div>
  );
};
