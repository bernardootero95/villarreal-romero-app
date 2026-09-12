import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.tsx";
import "./index.css";

// Inyección dinámica de colores corporativos (Marca Blanca)
const colorPrimario = import.meta.env.VITE_COLOR_PRIMARIO || "#0D2E5E";
const colorAccent = import.meta.env.VITE_COLOR_ACCENT || "#C9A84C";

document.documentElement.style.setProperty("--color-primary", colorPrimario);
document.documentElement.style.setProperty("--color-accent", colorAccent);

// Inyección dinámica de nombre corporativo en el título y metadata de la pestaña
const empresaNombre =
  import.meta.env.VITE_EMPRESA_NOMBRE || "Villarreal-Romero";

document.title = `${empresaNombre} | Sistema de Gestión`;

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute(
    "content",
    `Sistema de Gestión y Vencimientos Tributarios - ${empresaNombre}`,
  );
}

// Favicon corporativo: reutiliza el mismo logo de marca blanca (VITE_LOGO_URL). Si la
// empresa no configuró uno, se conserva el favicon por defecto empaquetado en index.html.
const logoUrl = import.meta.env.VITE_LOGO_URL;
if (logoUrl) {
  const faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (faviconLink) {
    faviconLink.href = logoUrl;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
