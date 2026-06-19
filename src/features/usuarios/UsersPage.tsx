import { useEffect, useState } from "react";
import { type Usuario } from "./types";
import { usuariosService } from "./usuariosService";
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserForm } from "./UserForm";

export const UsersPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ESTADOS Y CONSTANTES PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // Puedes cambiar este número para mostrar más o menos filas

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Si el usuario escribe algo en el buscador, regresamos a la página 1 para evitar que la tabla quede vacía
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de desactivar este usuario? El sistema cambiará su estado a INACTIVO y registrará el movimiento en la auditoría.",
      )
    ) {
      try {
        await usuariosService.delete(id);
        fetchUsuarios();
      } catch (error) {
        alert("Error al desactivar el miembro del equipo");
      }
    }
  };

  const handleEdit = (user: Usuario) => {
    setUsuarioEditando(user);
    setShowForm(true);
  };

  const handleCreate = () => {
    setUsuarioEditando(null);
    setShowForm(true);
  };

  // 1. Aplicamos el Filtro de búsqueda primero
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 2. Lógica Matemática de Paginación
  const totalPages = Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // 3. Cortamos el arreglo para obtener solo los de la página actual
  const paginatedUsuarios = usuariosFiltrados.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-title font-bold text-primary">
            Equipo de Trabajo
          </h1>
          <p className="text-text-muted">
            Gestiona los miembros de Villarreal-Romero y sus cargos.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="card-container !p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o cargo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-surface text-sm focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Cargo</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    Cargando equipo...
                  </td>
                </tr>
              ) : paginatedUsuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    {searchTerm
                      ? "No se encontraron usuarios que coincidan con la búsqueda."
                      : "No hay usuarios registrados."}
                  </td>
                </tr>
              ) : (
                paginatedUsuarios.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary">
                          {user.nombre_completo}
                        </span>
                        <span className="text-xs text-text-muted">
                          @{user.username}
                        </span>
                        {user.email && (
                          <span className="text-[11px] text-text-muted font-mono mt-0.5">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full border border-primary/10">
                        {user.cargo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          user.estado === "ACTIVO"
                            ? "text-success"
                            : user.estado === "SUSPENDIDO"
                              ? "text-amber-500"
                              : "text-danger"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.estado === "ACTIVO"
                              ? "bg-success"
                              : user.estado === "SUSPENDIDO"
                                ? "bg-amber-500"
                                : "bg-danger"
                          }`}
                        />
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-text-muted hover:text-accent p-2 transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-text-muted hover:text-danger p-2 transition-colors"
                          title="Desactivar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!loading && usuariosFiltrados.length > 0 && (
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
                  usuariosFiltrados.length,
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-text-main">
                {usuariosFiltrados.length}
              </span>{" "}
              usuarios
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
        <UserForm
          usuarioAEditar={usuarioEditando}
          onClose={() => {
            setShowForm(false);
            setUsuarioEditando(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setUsuarioEditando(null);
            fetchUsuarios();
          }}
        />
      )}
    </div>
  );
};
