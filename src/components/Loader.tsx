import { Loader2 } from "lucide-react";

interface LoaderProps {
  texto?: string;
  fullScreen?: boolean; // Para decidir si ocupa toda la pantalla o solo un bloque
}

export const Loader = ({
  texto = "Procesando información...",
  fullScreen = false,
}: LoaderProps) => {
  // Estilos dinámicos dependiendo de dónde se use
  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm"
    : "flex flex-col items-center justify-center w-full min-h-[50vh] p-8";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        {/* Anillo exterior giratorio en color acento */}
        <Loader2 className="w-full h-full text-accent animate-spin absolute inset-0" />

        {/* ÍCONO CORPORATIVO PERSONALIZADO: Silueta exacta del templete de Villarreal-Romero */}
        <div className="w-7 h-7 flex items-center justify-center text-primary mt-[-2px]">
          <svg
            viewBox="0 0 100 100"
            fill="currentColor"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cúpula / Esfera superior */}
            <circle cx="50" cy="14" r="3.5" />

            {/* Techo superior chico */}
            <path d="M40 22h20v3H40z" rx="1" />

            {/* Techo principal curvo del templete */}
            <path d="M22 36.5 C 24 25, 76 25, 78 36.5 Z" />
            <path d="M20 36h60v3.5H20z" rx="1.5" />

            {/* Arquitrabe / Viga superior interna */}
            <path d="M26 42.5h48v3H26z" />

            {/* Columnas (4 soportes verticales estilizados) */}
            <rect x="29" y="48.5" width="4" height="27" rx="0.5" />
            <rect x="42" y="48.5" width="4.5" height="27" rx="0.5" />
            <rect x="53.5" y="48.5" width="4.5" height="27" rx="0.5" />
            <rect x="67" y="48.5" width="4" height="27" rx="0.5" />

            {/* Base / Escalinata del templete (Tres niveles decrecientes) */}
            <path d="M21 78.5h58v3.5H21z" rx="1" />
            <path d="M16 84.5h68v3.5H16z" rx="1" />
            <path d="M24 91h4l2.5-3h39l2.5 3h4V91z" />
          </svg>
        </div>
      </div>

      {/* Texto con efecto de latido (pulse) */}
      <p className="text-sm font-mono font-semibold text-primary/70 animate-pulse tracking-wide uppercase">
        {texto}
      </p>
    </div>
  );
};
