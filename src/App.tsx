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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta Pública de Autenticación */}
          <Route path="/login" element={<LoginPage />} />

          {/* Subárbol de Rutas Protegidas */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Dashboard */}
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

                    {/* Módulo de Usuarios (Protegido por Cargo) */}
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

                    {/* Redirección automática */}
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
