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
import { ImpuestosPage } from "./features/impuestos/ImpuestosPage";
import { CalendarioBasePage } from "./features/calendario-base/CalendarioBasePage";

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

                    {/* Ruta de Clientes: Accesible a todos, permisos manejados dentro del componente */}
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/impuestos" element={<ImpuestosPage />} />
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
