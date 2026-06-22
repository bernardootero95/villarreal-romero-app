import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { Layout } from "./components/Layout";
import { UsersPage } from "./features/usuarios/UsersPage";
import { ClientesPage } from "./features/clientes/ClientesPage";
import { DetalleClientePage } from "./features/clientes/DetalleClientePage"; // <-- Importación de la página autónoma de detalle
import { ImpuestosPage } from "./features/impuestos/ImpuestosPage";
import { CalendarioBasePage } from "./features/calendario-base/CalendarioBasePage";
import { CalendarioPage } from "./features/calendario/CalendarioPage";
import { PerfilPage } from "./features/perfil/PerfilPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <div className="card-container">
                          <h1 className="text-xl font-semibold mb-2">
                            Resumen General
                          </h1>
                          <p className="text-text-muted">
                            El panel principal del sistema estará aquí.
                          </p>
                        </div>
                      }
                    />

                    {/* Ruta de Clientes: Directorio general */}
                    <Route path="/clientes" element={<ClientesPage />} />

                    {/* ENRUTAMIENTO DINÁMICO: 
                        Ficha profunda indexada por ID de Supabase para Deep Linking nativo 
                    */}
                    <Route
                      path="/clientes/:id"
                      element={<DetalleClientePage />}
                    />

                    <Route path="/impuestos" element={<ImpuestosPage />} />
                    <Route path="perfil" element={<PerfilPage />} />
                    <Route
                      path="/calendario-base"
                      element={
                        <ProtectedRoute
                          cargosPermitidos={["Gerente", "Ingeniero"]}
                        >
                          <CalendarioBasePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/calendario" element={<CalendarioPage />} />
                    <Route
                      path="/usuarios"
                      element={
                        <ProtectedRoute
                          cargosPermitidos={["Gerente", "Ingeniero"]}
                        >
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
