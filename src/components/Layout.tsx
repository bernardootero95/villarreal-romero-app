import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  Calendar,
  CheckSquare,
  LogOut,
  BarChart2,
  Building2,
  Landmark,
  UserCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "./Footer";

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
      icon: <UserCircle className="w-5 h-5" />,
      label: "Mi Perfil",
      path: "/perfil",
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      label: "Clientes",
      path: "/clientes",
    },
    {
      icon: <Landmark className="w-5 h-5" />,
      label: "Impuestos",
      path: "/impuestos",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Calendario Base",
      path: "/calendario-base",
      roles: ["Gerente", "Ingeniero"],
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
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Sidebar - Panel Lateral Fijo */}
      <aside className="w-64 bg-primary text-surface flex flex-col justify-between shadow-md z-10 flex-shrink-0 h-full">
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

      {/* Contenedor Derecho Completo (Ocupa el resto de la pantalla de forma rígida) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Contenedor con Scroll - Únicamente para el contenido dinámico */}
        <main className="flex-1 overflow-y-auto p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>

        {/* Footer Persistente (Siempre visible abajo, fuera del flujo del scroll) */}
        <Footer />
      </div>
    </div>
  );
};
