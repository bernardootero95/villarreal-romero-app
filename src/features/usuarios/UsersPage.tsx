import { useEffect, useState } from "react";
import { type Usuario } from "./types"; // <-- Importación Vite fix
import { usuariosService } from "./usuariosService";
import { UserPlus, Search, Trash2, Edit2 } from "lucide-react"; // <-- Edit2 importado
import { UserForm } from "./UserForm";

export const UsersPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Nuevo estado para controlar el usuario seleccionado para edición
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de desactivar este usuario? El sistema cambiará su estado a INACTIVO y registrará el movimiento en la auditoría.",
      )
    ) {
      try {
        await usuariosService.delete(id);
        fetchUsuarios(); // Recargar tabla
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

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
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

      <div className="card-container !p-0 overflow-hidden">
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

        <div className="overflow-x-auto">
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
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => (
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
                          <span className="text-[11px] text-text-muted font-mono">
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
                        {/* Botón de Editar */}
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-text-muted hover:text-accent p-2 transition-colors"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Botón de Desactivar */}
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
