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
  return AuthProvider({
    children: Router({
      children: Routes({
        children: [
          Route({ path: "/login", element: LoginPage() }),
          Route({
            path: "/*",
            element: ProtectedRoute({
              children: Layout({
                children: Routes({
                  children: [
                    Route({
                      path: "/",
                      element: (
                        <div className="card-container">
                          <h1 className="text-xl font-semibold mb-2">
                            Resumen General
                          </h1>
                          <p className="text-text-muted">
                            El panel principal del sistema estará aquí.
                          </p>
                        </div>
                      ),
                    }),
                    Route({
                      path: "/usuarios",
                      element: ProtectedRoute({
                        cargosPermitidos: ["Gerente", "Ingeniero"], // <--- Restricción a nivel de enrutador
                        children: UsersPage(),
                      }),
                    }),
                    Route({
                      path: "*",
                      element: Navigate({ to: "/", replace: true }),
                    }),
                  ],
                }),
              }),
            }),
          }),
        ],
      }),
    }),
  });
}

export default App;
