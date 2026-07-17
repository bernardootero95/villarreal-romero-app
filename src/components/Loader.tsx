import { Loader2, Building2 } from "lucide-react";

interface LoaderProps {
  texto?: string;
  fullScreen?: boolean;
}

export const Loader = ({
  texto = "Procesando información...",
  fullScreen = false,
}: LoaderProps) => {
  const logoUrl = import.meta.env.VITE_LOGO_URL || "";
  const empresaNombre = import.meta.env.VITE_EMPRESA_NOMBRE || "Empresa";

  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    : "flex flex-col items-center justify-center w-full min-h-[50vh] p-8";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center w-28 h-28 mb-5">
        <Loader2 className="w-full h-full text-accent/60 animate-spin absolute inset-0" />

        <div className="w-16 h-16 flex items-center justify-center overflow-hidden relative rounded-full bg-transparent">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Isotipo ${empresaNombre}`}
              className="w-full h-full object-contain transform scale-[2.5] select-none"
            />
          ) : (
            <Building2 className="w-8 h-8 text-primary/40" />
          )}
        </div>
      </div>

      <p className="text-xs font-mono font-bold text-primary/80 animate-pulse tracking-widest uppercase">
        {texto}
      </p>
    </div>
  );
};
