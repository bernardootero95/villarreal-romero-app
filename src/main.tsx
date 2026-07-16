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
