import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 1. Leemos el color desde las variables de entorno de Vercel (o usamos el default)
const colorPrimario = import.meta.env.VITE_COLOR_PRIMARIO || "#0D2E5E";

// 2. Lo inyectamos en la raíz del documento HTML de forma dinámica
document.documentElement.style.setProperty("--color-primary", colorPrimario);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
