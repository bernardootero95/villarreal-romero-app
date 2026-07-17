import { useEffect, useRef } from "react";

export const useInactividad = (onInactivo: () => void, minutos: number = 15) => {
  const temporizador = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const reiniciarTemporizador = () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(onInactivo, minutos * 60 * 1000);
    };

    const eventos = [
      "mousemove",
      "mousedown",
      "keypress",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    eventos.forEach((evento) =>
      document.addEventListener(evento, reiniciarTemporizador)
    );
    
    reiniciarTemporizador(); 

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      eventos.forEach((evento) =>
        document.removeEventListener(evento, reiniciarTemporizador)
      );
    };
  }, [onInactivo, minutos]);
};