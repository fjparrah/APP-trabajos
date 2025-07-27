import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import "./Dashboard.css";

// Tipos
type User = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  perfil?: { rol?: string };
};

type Tarea = {
  id: number;
  descripcion: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  operador?: User;
  empresa?: any;
  faena?: any;
  ubicacion?: any;
  personas_involucradas?: any[];
  vehiculos?: any[];
  herramientas?: any[];
  foto_inicio?: string;
  foto_fin?: string;
  observaciones?: string;
  duracion_minutos?: number;
};

const COLORS = ["#1a78e6", "#38c6f4", "#fcb026", "#ff4848", "#8ae89e"];

function diferenciaEnMinutos(fechaInicio: string, fechaFin?: string) {
  if (!fechaInicio || !fechaFin) return "-";
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const minutos = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  return minutos >= 0 ? minutos : "-";
}

export default function Dashboard() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  const [usuario, setUsuario] = useState<User | null>(null);
  const [verTarea, setVerTarea] = useState<Tarea | null>(null);
  const [finalizarTarea, setFinalizarTarea] = useState<Tarea | null>(null);
  const [editarTarea, setEditarTarea] = useState<Tarea | null>(null);
  const [operadores, setOperadores] = useState<User[]>([]);

  // Finalizar
  const [finalizando, setFinalizando] = useState(false);
  const [fotoFin, setFotoFin] = useState<File | null>(null);
  const [obsFin, setObsFin] = useState("");
  const [errorFinalizar, setErrorFinalizar] = useState("");

  // Filtros y búsqueda
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | "INICIADA" | "FINALIZADA">("TODAS");
  const [busqueda, setBusqueda] = useState("");

  // --- Cargar usuario, tareas y operadores
  const fetchTareas = async () => {
    setLoading(true);
    try {
      const access = localStorage.getItem("access");
      const response = await axios.get("/api/core/tareas/", {
        headers: { Authorization: `Bearer ${access}` },
      });
      setTareas(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const access = localStorage.getItem("access");
        const response = await axios.get("/api/core/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        setUsuario(response.data);
      } catch {
        setUsuario(null);
      }
    };
    const fetchOperadores = async () => {
      try {
        const access = localStorage.getItem("access");
        const response = await axios.get("/api/core/usuarios/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        setOperadores(response.data);
      } catch {
        setOperadores([]);
      }
    };
    fetchUsuario();
    fetchTareas();
    fetchOperadores();
  }, []);

  // --- Filtro y búsqueda
  const tareasFiltradas = useMemo(() => {
    let datos = [...tareas];
    if (filtroEstado !== "TODAS") datos = datos.filter(t => t.estado === filtroEstado);
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      datos = datos.filter(
        t =>
          t.descripcion?.toLowerCase().includes(b) ||
          t.operador?.username?.toLowerCase().includes(b) ||
          t.id?.toString().includes(b)
      );
    }
    return datos;
  }, [tareas, filtroEstado, busqueda]);

  // --- Tarjetas y gráficos
  const total = tareas.length;
  const iniciadas = tareas.filter(t => t.estado === "INICIADA").length;
  const finalizadas = tareas.filter(t => t.estado === "FINALIZADA").length;
  const promedioDuracion = Math.round(
    tareas.filter(t => t.duracion_minutos).reduce((sum, t) => sum + (t.duracion_minutos ?? 0), 0) / (finalizadas || 1)
  );
  const pieData = [
    { name: "Iniciadas", value: iniciadas },
    { name: "Finalizadas", value: finalizadas },
  ];
  const operadoresList = Array.from(new Set(tareas.map(t => t.operador?.username || t.operador))).filter(Boolean);
  const barData = operadoresList.map(op => ({
    name: String(op),
    Iniciadas: tareas.filter(t => (t.operador?.username || t.operador) === op && t.estado === "INICIADA").length,
    Finalizadas: tareas.filter(t => (t.operador?.username || t.operador) === op && t.estado === "FINALIZADA").length,
  }));

  const nombreUsuario = (u?: User) =>
    u ? (u.first_name || u.last_name ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : u.username) : "-";

  // Solo admin puede editar
  const esAdmin = usuario?.is_superuser || usuario?.perfil?.rol === "ADMIN";

  // ----------- Finalizar tarea (modal)
  const handleFinalizar = async (tarea: Tarea) => {
    if (!fotoFin) {
      setErrorFinalizar("Debes subir una fotografía de finalización.");
      return;
    }
    setFinalizando(true);
    setErrorFinalizar("");
    try {
      const access = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("estado", "FINALIZADA");
      formData.append("fecha_fin", new Date().toISOString());
      formData.append("foto_fin", fotoFin);
      formData.append("observaciones", obsFin);
      await axios.patch(`/api/core/tareas/${tarea.id}/`, formData, {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFinalizarTarea(null);
      setFotoFin(null);
      setObsFin("");
      await fetchTareas(); // refresca lista
    } catch (err: any) {
      setErrorFinalizar("Error al finalizar la tarea.");
    } finally {
      setFinalizando(false);
    }
  };

  // ----------- Modal editar (corregido)
  function EditTaskModal({
    tarea,
    operadores,
    onClose,
    onEditada,
  }: {
    tarea: Tarea;
    operadores: User[];
    onClose: () => void;
    onEditada: () => void;
  }) {
    // Estados controlados sincronizados por useEffect
    const [descripcion, setDescripcion] = useState("");
    const [estado, setEstado] = useState<"INICIADA" | "FINALIZADA">("INICIADA");
    const [observaciones, setObservaciones] = useState("");
    const [operadorId, setOperadorId] = useState<string>("");

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
      setDescripcion(tarea.descripcion || "");
      setEstado((tarea.estado as "INICIADA" | "FINALIZADA") || "INICIADA");
      setObservaciones(tarea.observaciones || "");
      setOperadorId(tarea.operador?.id ? String(tarea.operador.id) : "");
    }, [tarea]);

    const handleSave = async () => {
      setError("");
      setSuccess("");
      if (!operadorId) {
        setError("Debes seleccionar un operador.");
        return;
      }
      setGuardando(true);
      try {
        const access = localStorage.getItem("access");
        await axios.patch(
          `/api/core/tareas/${tarea.id}/`,
          {
            descripcion,
            observaciones,
            estado,
            operador: operadorId,
          },
          {
            headers: { Authorization: `Bearer ${access}` },
          }
        );
        setSuccess("Tarea editada correctamente.");
        onEditada();
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (e) {
        setError("No se pudo actualizar la tarea.");
      } finally {
        setGuardando(false);
      }
    };

    const nombreUsuario = (u?: User) =>
      u
        ? u.first_name || u.last_name
          ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() + ` (${u.username})`
          : u.username
        : "-";
    console.log("OperadorID:", operadorId, "tarea:", tarea.operador, "operadores:", operadores);
    return (
      <div className="modal-bg">
        <div className="modal-card modal-edit">
          <h3>Editar Tarea</h3>
          <div className="detalle-row"><b>ID:</b> {tarea.id}</div>
          <div className="detalle-row">
            <label>
              <b>Descripción:</b>
              <input
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                style={{ width: "100%", marginTop: 6 }}
              />
            </label>
          </div>
          <div className="detalle-row">
            <label>
              <b>Operador:</b>
              <select
                value={operadorId}
                onChange={e => setOperadorId(e.target.value)}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">-- Selecciona --</option>
                {operadores.map(op => (
                  <option value={String(op.id)} key={op.id}>{nombreUsuario(op)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="detalle-row">
            <label>
              <b>Estado:</b>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as "INICIADA" | "FINALIZADA")}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="INICIADA">INICIADA</option>
                <option value="FINALIZADA">FINALIZADA</option>
              </select>
            </label>
          </div>
          <div className="detalle-row">
            <label>
              <b>Observaciones:</b>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
                style={{ width: "100%", marginTop: 6 }}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {success && <div style={{ color: "#159d69", margin: "5px 0" }}>{success}</div>}
          <div className="modal-actions">
            <button className="cerrar-modal-btn" onClick={onClose}>Cancelar</button>
            <button
              className="editar-btn"
              style={{ marginLeft: 8 }}
              onClick={handleSave}
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render
  return (
    <Layout>
      <div className="dashboard-container">
        <div style={{ marginBottom: 22, fontWeight: 500, fontSize: 22 }}>
          Bienvenido{usuario ? `, ${nombreUsuario(usuario)} (${usuario.username})` : ""} 👋
        </div>

        <h2 className="dashboard-title">Dashboard de Tareas</h2>
        {/* Tarjetas */}
        <div className="dashboard-cards">
          <div className="dashboard-card total">Total<br /><span>{total}</span></div>
          <div className="dashboard-card iniciadas">Iniciadas<br /><span>{iniciadas}</span></div>
          <div className="dashboard-card finalizadas">Finalizadas<br /><span>{finalizadas}</span></div>
          <div className="dashboard-card duracion">Prom. duración (min)<br /><span>{isNaN(promedioDuracion) ? '-' : promedioDuracion}</span></div>
        </div>

        {/* Gráficos */}
        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <h4>Estado de tareas</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-chart">
            <h4>Tareas por operador</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Iniciadas" stackId="a" fill="#1a78e6" />
                <Bar dataKey="Finalizadas" stackId="a" fill="#38c6f4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16,
        }}>
          <div className="filtros-btn-group">
            <button
              className={filtroEstado === "TODAS" ? "filtro-btn activo" : "filtro-btn"}
              onClick={() => setFiltroEstado("TODAS")}
            >Todas</button>
            <button
              className={filtroEstado === "INICIADA" ? "filtro-btn activo" : "filtro-btn"}
              onClick={() => setFiltroEstado("INICIADA")}
            >Iniciadas</button>
            <button
              className={filtroEstado === "FINALIZADA" ? "filtro-btn activo" : "filtro-btn"}
              onClick={() => setFiltroEstado("FINALIZADA")}
            >Finalizadas</button>
          </div>
          <input
            type="text"
            className="busqueda-input"
            placeholder="Buscar por descripción, operador, ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              minWidth: 230,
              borderRadius: 8,
              padding: "7px 13px",
              border: "1px solid #c3d6ec",
              background: "#fff",
              fontSize: "1rem",
            }}
          />
        </div>

        {/* Tabla responsive */}
        <div className="dashboard-table-wrapper">
          <div style={{ overflowX: "auto" }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Duración (min)</th>
                  <th>Foto inicio</th>
                  <th>Foto fin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareasFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.descripcion}</td>
                    <td>
                      <span className={
                        t.estado === "FINALIZADA" ? "badge badge-success" : "badge badge-warning"
                      }>
                        {t.estado}
                      </span>
                    </td>
                    <td>{t.fecha_inicio ? t.fecha_inicio.slice(0, 16).replace("T", " ") : ""}</td>
                    <td>{t.fecha_fin ? t.fecha_fin.slice(0, 16).replace("T", " ") : "-"}</td>
                    <td>
                      {t.fecha_fin ? diferenciaEnMinutos(t.fecha_inicio, t.fecha_fin) : "-"}
                    </td>
                    <td>
                      {t.foto_inicio
                        ? <img src={t.foto_inicio} alt="Inicio" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid #eee" }} />
                        : <span style={{ color: "#bbb" }}>-</span>
                      }
                    </td>
                    <td>
                      {t.foto_fin
                        ? <img src={t.foto_fin} alt="Fin" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid #eee" }} />
                        : <span style={{ color: "#bbb" }}>-</span>
                      }
                    </td>
                    <td>
                      <button className="ver-btn" onClick={() => setVerTarea(t)}>Ver</button>
                      {t.estado !== "FINALIZADA" && (
                        <button className="fin-btn" onClick={() => {
                          setFinalizarTarea(t);
                          setFotoFin(null);
                          setObsFin("");
                          setErrorFinalizar("");
                        }} style={{ marginLeft: 6 }}>Finalizar</button>
                      )}
                      {esAdmin && (
                        <button className="editar-btn" onClick={() => setEditarTarea(t)} style={{ marginLeft: 6 }}>
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal VER */}
        {verTarea && (
          <div className="modal-bg">
            <div className="modal-card">
              <h3>Detalle de Tarea</h3>
              <div className="detalle-row"><b>ID:</b> {verTarea.id}</div>
              <div className="detalle-row"><b>Descripción:</b> {verTarea.descripcion}</div>
              <div className="detalle-row">
                <b>Estado:</b>{" "}
                <span className={verTarea.estado === "FINALIZADA" ? "badge badge-success" : "badge badge-warning"}>{verTarea.estado}</span>
              </div>
              <div className="detalle-row"><b>Fecha inicio:</b> {verTarea.fecha_inicio?.slice(0, 16).replace("T", " ")}</div>
              <div className="detalle-row"><b>Fecha fin:</b> {verTarea.fecha_fin?.slice(0, 16).replace("T", " ") || "-"}</div>
              <div className="detalle-row"><b>Duración (min):</b> {verTarea.fecha_fin ? diferenciaEnMinutos(verTarea.fecha_inicio, verTarea.fecha_fin) : "-"}</div>
              <div className="detalle-row"><b>Empresa:</b> {verTarea.empresa?.nombre || "-"}</div>
              <div className="detalle-row"><b>Faena:</b> {verTarea.faena?.nombre || "-"}</div>
              <div className="detalle-row"><b>Ubicación:</b> {verTarea.ubicacion?.nombre || "-"}</div>
              <div className="detalle-row"><b>Operador:</b> {nombreUsuario(verTarea.operador)}</div>
              <div className="detalle-row"><b>Personas Involucradas:</b>{" "}
                {verTarea.personas_involucradas?.length
                  ? verTarea.personas_involucradas.map(nombreUsuario).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Vehículos:</b>{" "}
                {verTarea.vehiculos?.length
                  ? verTarea.vehiculos.map((v: any) => v.nombre).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Herramientas:</b>{" "}
                {verTarea.herramientas?.length
                  ? verTarea.herramientas.map((h: any) => h.nombre).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Observaciones:</b> {verTarea.observaciones || "-"}</div>
              <div className="detalle-row">
                <b>Foto inicio:</b><br />
                {verTarea.foto_inicio
                  ? <img src={verTarea.foto_inicio} alt="Inicio" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover", margin: "4px 0", border: "1px solid #eee" }} />
                  : <span style={{ color: "#bbb" }}>-</span>}
              </div>
              <div className="detalle-row">
                <b>Foto fin:</b><br />
                {verTarea.foto_fin
                  ? <img src={verTarea.foto_fin} alt="Fin" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover", margin: "4px 0", border: "1px solid #eee" }} />
                  : <span style={{ color: "#bbb" }}>-</span>}
              </div>
              <div className="modal-actions">
                <button className="cerrar-modal-btn" onClick={() => setVerTarea(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal FINALIZAR */}
        {finalizarTarea && (
          <div className="modal-bg">
            <div className="modal-card modal-edit">
              <h3>Finalizar Tarea</h3>
              <div className="detalle-row"><b>Descripción:</b> {finalizarTarea.descripcion}</div>
              <div className="detalle-row"><b>Estado:</b> {finalizarTarea.estado}</div>
              <div className="detalle-row"><b>Fecha inicio:</b> {finalizarTarea.fecha_inicio?.slice(0, 16).replace("T", " ")}</div>
              <div className="detalle-row"><b>Fecha fin:</b> {finalizarTarea.fecha_fin?.slice(0, 16).replace("T", " ") || "-"}</div>
              <div className="detalle-row"><b>Duración (min):</b> {finalizarTarea.fecha_fin ? diferenciaEnMinutos(finalizarTarea.fecha_inicio, finalizarTarea.fecha_fin) : "-"}</div>
              <div className="detalle-row">
                <b>Foto de inicio:</b><br />
                {finalizarTarea.foto_inicio
                  ? <img src={finalizarTarea.foto_inicio} alt="Inicio" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover", margin: "4px 0", border: "1px solid #eee" }} />
                  : <span style={{ color: "#bbb" }}>-</span>}
              </div>
              <div className="detalle-row">
                <label>
                  Sube la foto de finalización:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFotoFin(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="detalle-row">
                <label>
                  Observaciones (opcional):
                  <textarea
                    value={obsFin}
                    onChange={e => setObsFin(e.target.value)}
                    rows={2}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                </label>
              </div>
              {errorFinalizar && <div className="form-error">{errorFinalizar}</div>}
              <div className="modal-actions">
                <button className="cerrar-modal-btn" onClick={() => setFinalizarTarea(null)}>Cancelar</button>
                <button
                  className="finalizar-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => finalizarTarea && handleFinalizar(finalizarTarea)}
                  disabled={finalizando}
                >
                  {finalizando ? "Finalizando..." : "Finalizar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal EDITAR */}
        
        {editarTarea && (
          
          <EditTaskModal
            tarea={editarTarea}
            operadores={operadores}
            onClose={() => setEditarTarea(null)}
            onEditada={fetchTareas}
          />
        )}
      </div>
    </Layout>
  );
}




