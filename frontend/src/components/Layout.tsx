import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // Cargar usuario solo una vez
  useEffect(() => {
    async function fetchUser() {
      try {
        const access = localStorage.getItem("access");
        if (!access) return;
        const { data } = await axios.get("/api/core/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        setUsuario(data);
      } catch {
        setUsuario(null);
      }
    }
    fetchUser();
  }, []);

  function handleNavClick() {
    setSidebarOpen(false);
  }

  const esAdmin = usuario?.is_superuser || usuario?.perfil?.rol === "ADMIN";

  return (
    <div className="layout-root">
      {/* Overlay para mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button
          className="sidebar-hamburger-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg width={30} height={30} viewBox="0 0 24 24">
            <line x1="6" y1="6" x2="18" y2="18" stroke="#fff" strokeWidth="2" />
            <line x1="6" y1="18" x2="18" y2="6" stroke="#fff" strokeWidth="2" />
          </svg>
        </button>
        <div className="sidebar-body">
          <div className="sidebar-title">🛠️ Registro de Trabajos</div>
          <nav className="sidebar-nav">
            {esAdmin && (
              <Link
                className={location.pathname === "/dashboard" ? "active" : ""}
                to="/dashboard"
                onClick={handleNavClick}
              >
                Dashboard
              </Link>
            )}
            <Link
              className={location.pathname.startsWith("/tareas") ? "active" : ""}
              to="/tareas"
              onClick={handleNavClick}
            >
              Tareas
            </Link>
          </nav>
        </div>
        <footer className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("access");
              localStorage.removeItem("refresh");
              window.location.href = "/login";
            }}
          >
            Cerrar sesión
          </button>
        </footer>
      </aside>
      {/* Botón hamburguesa FLOTANTE SOLO EN MOBILE/TABLET */}
      <button
        className="sidebar-float-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <svg width={32} height={32} viewBox="0 0 24 24">
          <rect y="4" width="24" height="3" rx="1.5" fill="#fff" />
          <rect y="10.5" width="24" height="3" rx="1.5" fill="#fff" />
          <rect y="17" width="24" height="3" rx="1.5" fill="#fff" />
        </svg>
      </button>
      <main className="main-content">{children}</main>
    </div>
  );
}





    


