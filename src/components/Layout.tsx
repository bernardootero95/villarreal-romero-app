import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Calendar,
  CheckSquare,
  LogOut,
  BarChart2,
  Building2,
  Landmark,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { signOut, perfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: "Dashboard",
      path: "/",
    },
    {
      icon: <Building2 className="w-5 h-5" />, // <--- Nueva opción visible para todos
      label: "Clientes",
      path: "/clientes",
    },
    {
      icon: <Landmark className="w-5 h-5" />, // <--- Nueva opción visible para todos
      label: "Impuestos",
      path: "/impuestos",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Calendario Base",
      path: "/calendario-base",
      roles: ["Gerente", "Ingeniero"], // Solo administradores parametrizan el calendario oficial
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Usuarios",
      path: "/usuarios",
      roles: ["Gerente", "Ingeniero"],
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Calendario",
      path: "/calendario",
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      label: "Vencimientos",
      path: "/vencimientos",
    },
  ];

  const filteredMenu = menuItems.filter((item) => {
    if (!item.roles) return true;
    return perfil ? item.roles.includes(perfil.cargo) : false;
  });

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-primary text-surface flex flex-col justify-between shadow-md z-10">
        <div>
          <div className="p-6 border-b border-surface/10">
            <h2 className="text-xl font-title font-semibold text-surface tracking-wide">
              Villarreal-Romero
            </h2>
            <p className="text-xs text-accent mt-1 font-body font-medium uppercase tracking-wider">
              Asesorías Contables
            </p>
            {perfil && (
              <div className="mt-3 pt-2 border-t border-surface/5">
                <p className="text-xs text-surface font-semibold truncate">
                  {perfil.nombre_completo}
                </p>
                <p className="text-[10px] text-accent/80 font-mono">
                  {perfil.cargo}
                </p>
              </div>
            )}
          </div>

          <nav className="mt-6 px-3 space-y-1">
            {filteredMenu.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all text-left duration-200 ${
                    isActive
                      ? "bg-surface/10 text-accent border-l-4 border-accent"
                      : "text-surface/80 hover:bg-surface/5 hover:text-surface"
                  }`}
                >
                  <div className={isActive ? "text-accent" : "text-surface/60"}>
                    {item.icon}
                  </div>
                  <span className="font-body">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-surface/10">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-surface/70 hover:bg-danger/20 hover:text-danger-light transition-colors text-left"
          >
            <LogOut className="w-5 h-5 text-surface/50" />
            <span className="font-body">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
