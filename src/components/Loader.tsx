import { Landmark, Loader2 } from "lucide-react";

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

        {/* Ícono corporativo central estático */}
        <Landmark className="w-6 h-6 text-primary" />
      </div>

      {/* Texto con efecto de latido (pulse) */}
      <p className="text-sm font-mono font-semibold text-primary/70 animate-pulse tracking-wide uppercase">
        {texto}
      </p>
    </div>
  );
};
