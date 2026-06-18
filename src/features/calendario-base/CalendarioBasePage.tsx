import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { calendarioBaseService } from "./calendarioBaseService";
import type { CalendarioBaseConImpuesto } from "./types";
import {
  CalendarDays,
  Plus,
  Search,
  Trash2,
  Edit2,
  Filter,
  Upload,
} from "lucide-react"; // <-- Upload importado correctamente
import { CalendarioBaseForm } from "./CalendarioBaseForm";
import { CalendarioCargaMasiva } from "./CalendarioCargaMasiva";

export const CalendarioBasePage = () => {
  const { perfil } = useAuth();
  const [fechas, setFechas] = useState<CalendarioBaseConImpuesto[]>([]);
  const [loading, setLoading] = useState(true);

  // Control de Modales
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  const [fechaEditando, setFechaEditando] =
    useState<CalendarioBaseConImpuesto | null>(null);
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const fetchFechas = async () => {
    try {
      setLoading(true);
      const data = await calendarioBaseService.getAll(anioFiltro);
      setFechas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFechas();
  }, [anioFiltro]);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Deseas eliminar esta fecha oficial? Solo podrás hacerlo si no ha sido usada para generar vencimientos reales a clientes.",
      )
    ) {
      try {
        await calendarioBaseService.delete(id);
        fetchFechas();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const filteredFechas = fechas.filter(
    (f) =>
      f.impuestos?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.periodo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Calendario Base (Oficial)
          </h1>
          <p className="text-text-muted">
            Parametrización de fechas límite según decretos anuales.
          </p>
        </div>

        {puedeAdministrar && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkForm(true)}
              className="bg-surface border border-gray-200 text-text-main px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4 text-accent" />
              Carga Masiva
            </button>
            <button
              onClick={() => {
                setFechaEditando(null);
                setShowForm(true);
              }}
              className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Parametrizar Fecha
            </button>
          </div>
        )}
      </div>

      <div className="card-container !p-0 overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por impuesto o periodo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted font-medium">Año:</span>
            <select
              value={anioFiltro}
              onChange={(e) => setAnioFiltro(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-surface outline-none focus:ring-1 focus:ring-accent"
            >
              {[2024, 2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Impuesto</th>
                <th className="px-6 py-4 font-semibold text-center">Periodo</th>
                <th className="px-6 py-4 font-semibold text-center">Dígito</th>
                <th className="px-6 py-4 font-semibold">Fecha Límite</th>
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
                    colSpan={5}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    Cargando matriz de fechas...
                  </td>
                </tr>
              ) : filteredFechas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    No hay fechas parametrizadas para el año {anioFiltro}.
                  </td>
                </tr>
              ) : (
                filteredFechas.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-primary/40" />
                        <span className="font-semibold text-primary">
                          {f.impuestos?.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-mono font-bold bg-primary/5 text-primary px-2 py-1 rounded">
                        {f.periodo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm data-code">
                        {f.digito !== null ? f.digito : "Fija"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {new Date(
                        f.fecha_vencimiento_oficial + "T12:00:00",
                      ).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    {puedeAdministrar && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setFechaEditando(f);
                              setShowForm(true);
                            }}
                            className="text-text-muted hover:text-accent p-2 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="text-text-muted hover:text-danger p-2 transition-colors"
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
        <CalendarioBaseForm
          fechaAEditar={fechaEditando}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchFechas();
          }}
        />
      )}

      {showBulkForm && (
        <CalendarioCargaMasiva
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => {
            setShowBulkForm(false);
            fetchFechas();
          }}
        />
      )}
    </div>
  );
};
