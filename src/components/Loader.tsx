import { Loader2 } from "lucide-react";
// Importamos el logo oficial desde tus assets
import logoCorporativo from "../assets/LOGO-2.png";

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
      {/* Aumentamos el tamaño del marco general de 24x24 a 28x28 para dar más espacio */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-5">
        {/* Anillo exterior giratorio (más visible, subimos la opacidad a text-accent/60) */}
        <Loader2 className="w-full h-full text-accent/60 animate-spin absolute inset-0" />

        {/* CONTENEDOR DEL LOGO EXPANDIDO:
            - Subimos de w-14 a w-16 para que se acerque más al borde del anillo.
        */}
        <div className="w-16 h-16 flex items-center justify-center overflow-hidden relative rounded-full bg-transparent">
          <img
            src={logoCorporativo}
            alt="Isotipo Villarreal-Romero"
            className="w-full h-full object-contain transform scale-[2.5] select-none"
            /* AQUÍ EL CAMBIO CLAVE: 'scale-[2.5]' duplica y media el tamaño interno de la imagen.
              Esto recorta agresivamente todo el aire/espacio vacío exterior del archivo PNG,
              haciendo que el templete dorado del centro explote en tamaño y ocupe casi todo el círculo.
              (Si aún lo quieres más grande, puedes probar con scale-[2.8] o scale-[3.0])
            */
          />
        </div>
      </div>

      {/* Texto con efecto de latido (pulse) */}
      <p className="text-xs font-mono font-bold text-primary/80 animate-pulse tracking-widest uppercase">
        {texto}
      </p>
    </div>
  );
};
