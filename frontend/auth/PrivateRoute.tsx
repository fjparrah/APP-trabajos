import { useEffect, useState, type JSX } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

type Props = {
  children: JSX.Element;
  requireAdmin?: boolean;
};

export function PrivateRoute({ children, requireAdmin }: Props) {
  const [auth, setAuth] = useState<null | boolean>(null);
  const [admin, setAdmin] = useState<null | boolean>(null);

  useEffect(() => {
    async function checkAuth() {
      const access = localStorage.getItem("access");
      if (!access) {
        setAuth(false);
        return;
      }
      try {
        const { data } = await axios.get("/api/core/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        setAuth(true);
        // Admin = superuser o perfil.rol === ADMIN
        setAdmin(data.is_superuser || data.perfil?.rol === "ADMIN");
      } catch {
        setAuth(false);
      }
    }
    checkAuth();
  }, []);

  if (auth === null) return null; // O un loading...

  // No logeado
  if (!auth) return <Navigate to="/login" />;

  // Ruta requiere admin y NO es admin => redirige a tareas
  if (requireAdmin && !admin) return <Navigate to="/tareas" />;

  // Ok, autorizado
  return children;
}


