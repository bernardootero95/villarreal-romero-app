import { useEffect, useState } from "react";
import type { Usuario } from "./types";
import { usuariosService } from "./usuariosService";
import { UserPlus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { UserForm } from "./UserForm";

export const UsersPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchUsuarios = async () => {
    try {
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
        "¿Estás seguro de eliminar este usuario? Se mantendrá en auditoría.",
      )
    ) {
      await usuariosService.delete(id);
      fetchUsuarios();
    }
  };

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
          onClick={() => setShowForm(true)}
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
              ) : usuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-text-muted"
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
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
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full border border-primary/10">
                        {user.cargo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${user.estado === "ACTIVO" ? "text-success" : "text-danger"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${user.estado === "ACTIVO" ? "bg-success" : "bg-danger"}`}
                        />
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-text-muted hover:text-danger p-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchUsuarios();
          }}
        />
      )}
    </div>
  );
};
