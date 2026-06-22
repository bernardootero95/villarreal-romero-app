import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { clientesService } from "./clientesService";
import type { ClienteConContador } from "./types";
import {
  Building2,
  Search,
  Trash2,
  Plus,
  Edit2,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ClienteForm } from "./ClienteForm";
import { FichaObligaciones } from "./FichaObligaciones";
import { useNavigate } from "react-router-dom"; // <-- Importamos el hook nativo de navegación

export const ClientesPage = () => {
  const { perfil } = useAuth();
  const [clientes, setClientes] = useState<ClienteConContador[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- Instanciamos el navegador

  // Control de Modales
  const [showForm, setShowForm] = useState(false);
  const [clienteEditando, setClienteEditando] =
    useState<ClienteConContador | null>(null);
  const [clienteObligaciones, setClienteObligaciones] =
    useState<ClienteConContador | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // ESTADOS Y CONSTANTES PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const puedeAdministrar =
    perfil && ["Gerente", "Ingeniero"].includes(perfil.cargo);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesService.getAll();
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de desactivar a este cliente? Se mantendrá en el registro de auditoría.",
      )
    ) {
      try {
        await clientesService.delete(id);
        fetchClientes();
      } catch (error) {
        alert("Error al eliminar el cliente");
      }
    }
  };

  const handleEdit = (cliente: ClienteConContador) => {
    setClienteEditando(cliente);
    setShowForm(true);
  };

  const handleCreate = () => {
    setClienteEditando(null);
    setShowForm(true);
  };

  // 1. Filtrado de clientes
  const clientesFiltrados = clientes.filter(
    (c) =>
      c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit.includes(searchTerm),
  );

  // 2. Ordenamiento alfabético A-Z por Nombre/Razón Social
  clientesFiltrados.sort((a, b) =>
    a.razon_social.localeCompare(b.razon_social, "es", { sensitivity: "base" }),
  );

  // 3. Lógica Matemática de Paginación
  const totalPages = Math.ceil(clientesFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // 4. Arreglo cortado para la vista actual
  const paginatedClientes = clientesFiltrados.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Directorio de Clientes
          </h1>
          <p className="text-text-muted">
            Gestión de empresas y asignación de responsables contables.
          </p>
        </div>

        {puedeAdministrar && (
          <button
            onClick={handleCreate}
            className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        )}
      </div>

      <div className="card-container !p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Razón Social o NIT..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Empresa / Cliente</th>
                <th className="px-6 py-4 font-semibold">NIT</th>
                <th className="px-6 py-4 font-semibold">Responsable</th>
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
                    Cargando directorio...
                  </td>
                </tr>
              ) : paginatedClientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={puedeAdministrar ? 5 : 4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    {searchTerm
                      ? "No se encontraron clientes con esa búsqueda."
                      : "No hay clientes registrados."}
                  </td>
                </tr>
              ) : (
                paginatedClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {/* Lógica SOLID: Navegación real por URL dinámica */}
                      <div
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-surface transition-all">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary group-hover:text-accent transition-colors">
                            {cliente.razon_social}
                          </span>
                          <span className="text-xs text-text-muted">
                            {cliente.email || "Sin correo"}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono mt-0.5">
                            Cel: {cliente.celular || "No registrado"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="data-code bg-gray-100 px-2 py-1 rounded text-sm">
                        {cliente.nit}-{cliente.dv}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-main font-medium">
                        {cliente.usuarios?.nombre_completo || "Sin asignar"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${cliente.estado === "ACTIVO" ? "text-success" : "text-danger"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${cliente.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
                        />
                        {cliente.estado}
                      </span>
                    </td>
                    {puedeAdministrar && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setClienteObligaciones(cliente)}
                            className="text-text-muted hover:text-accent p-2 transition-colors bg-gray-50 hover:bg-accent/10 rounded-md border border-gray-100"
                            title="Gestionar Obligaciones Tributarias"
                          >
                            <Landmark className="w-4 h-4" />
                          </button>

                          <div className="w-px h-6 bg-gray-200 mx-1"></div>

                          <button
                            onClick={() => handleEdit(cliente)}
                            className="text-text-muted hover:text-accent p-2 transition-colors"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="text-text-muted hover:text-danger p-2 transition-colors"
                            title="Desactivar cliente"
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

        {/* CONTROLES DE PAGINACIÓN */}
        {!loading && clientesFiltrados.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-surface flex items-center justify-between text-sm">
            <span className="text-text-muted">
              Mostrando{" "}
              <span className="font-semibold text-text-main">
                {startIndex + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-text-main">
                {Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  clientesFiltrados.length,
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-text-main">
                {clientesFiltrados.length}
              </span>{" "}
              clientes
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-200 text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-text-muted font-medium px-2">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-gray-200 text-text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ClienteForm
          clienteAEditar={clienteEditando}
          onClose={() => {
            setShowForm(false);
            setClienteEditando(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setClienteEditando(null);
            fetchClientes();
          }}
        />
      )}

      {clienteObligaciones && (
        <FichaObligaciones
          cliente={clienteObligaciones}
          onClose={() => setClienteObligaciones(null)}
        />
      )}
    </div>
  );
};
