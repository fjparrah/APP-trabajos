import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import "./Tareas.css";

type User = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
};

type Entidad = { id: number; nombre: string };

type Tarea = {
  id: number;
  descripcion: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  operador?: User;
  personas_involucradas?: User[];
  vehiculos?: Entidad[];
  herramientas?: Entidad[];
  empresa?: Entidad;
  faena?: Entidad;
  ubicacion?: Entidad;
  observaciones?: string;
  foto_inicio?: string;
  foto_fin?: string;
  duracion_minutos?: number;
};

function diferenciaEnMinutos(fechaInicio: string, fechaFin?: string) {
  if (!fechaInicio || !fechaFin) return "-";
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const minutos = Math.round((fin.getTime() - inicio.getTime()) / 60000);
  return minutos >= 0 ? minutos : "-";
}

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [verTarea, setVerTarea] = useState<Tarea | null>(null);
  const [finalizarTarea, setFinalizarTarea] = useState<Tarea | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [fotoFin, setFotoFin] = useState<File | null>(null);
  const [obsFin, setObsFin] = useState("");
  const [errorFinalizar, setErrorFinalizar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS"|"INICIADA"|"FINALIZADA">("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

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

  useEffect(() => { fetchTareas(); }, []);

  // Filtro y búsqueda combinados
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

  // Tarjetas de resumen (igual que dashboard)
  const total = tareas.length;
  const iniciadas = tareas.filter(t => t.estado === "INICIADA").length;
  const finalizadas = tareas.filter(t => t.estado === "FINALIZADA").length;
  const promedioDuracion = Math.round(
    tareas.filter(t => t.duracion_minutos).reduce((sum, t) => sum + (t.duracion_minutos ?? 0), 0) / (finalizadas || 1)
  );

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
      fetchTareas();
    } catch (err: any) {
      setErrorFinalizar("Error al finalizar la tarea.");
    } finally {
      setFinalizando(false);
    }
  };

  const nombreUsuario = (u?: User) =>
    u ? (u.first_name || u.last_name ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : u.username) : "-";

  return (
    <Layout>
      <div className="tareas-main">

        <div className="tareas-header-row">
          <h2 className="tareas-title">Listado de Tareas</h2>
          <button className="nueva-tarea-btn" onClick={() => navigate("/tareas/nueva")}>
            + Nueva Tarea
          </button>
        </div>

        {/* TARJETAS DE RESUMEN */}
        <div className="dashboard-cards" style={{ marginBottom: 32 }}>
          <div className="dashboard-card total">Total<br /><span>{total}</span></div>
          <div className="dashboard-card iniciadas">Iniciadas<br /><span>{iniciadas}</span></div>
          <div className="dashboard-card finalizadas">Finalizadas<br /><span>{finalizadas}</span></div>
          <div className="dashboard-card duracion">Prom. duración (min)<br /><span>{isNaN(promedioDuracion) ? '-' : promedioDuracion}</span></div>
        </div>


        {/* FILTROS Y BUSCADOR */}
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

        <div className="tareas-table-wrapper">
          <table className="tareas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Fecha inicio</th>
                <th>Fecha fin</th>
                <th>Duración (min)</th>
                <th>Foto inicio</th>
                <th>Foto fin</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tareasFiltradas.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.descripcion}</td>
                  <td>
                    <span className={
                      t.estado === "FINALIZADA"
                        ? "badge badge-success"
                        : "badge badge-warning"
                    }>
                      {t.estado}
                    </span>
                  </td>
                  <td>{t.fecha_inicio ? t.fecha_inicio.slice(0, 16).replace("T", " ") : ""}</td>
                  <td>{t.fecha_fin ? t.fecha_fin.slice(0, 16).replace("T", " ") : "-"}</td>
                  <td>{t.fecha_fin ? diferenciaEnMinutos(t.fecha_inicio, t.fecha_fin) : "-"}</td>
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
                  <td style={{ textAlign: "right" }}>
                    <button className="ver-btn" onClick={() => setVerTarea(t)}>Ver</button>
                    {t.estado !== "FINALIZADA" && (
                      <button
                        className="finalizar-btn"
                        onClick={() => {
                          setFinalizarTarea(t);
                          setFotoFin(null);
                          setObsFin("");
                          setErrorFinalizar("");
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && tareasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "#bbb" }}>
                    No hay tareas registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL VER */}
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

        {/* MODAL FINALIZAR */}
        {finalizarTarea && (
          <div className="modal-bg">
            <div className="modal-card">
              <h3>Finalizar Tarea</h3>
              <div className="detalle-row"><b>Descripción:</b> {finalizarTarea.descripcion}</div>
              <div className="detalle-row"><b>Estado:</b> {finalizarTarea.estado}</div>
              <div className="detalle-row"><b>Fecha inicio:</b> {finalizarTarea.fecha_inicio?.slice(0, 16).replace("T", " ")}</div>
              <div className="detalle-row"><b>Fecha fin:</b> {finalizarTarea.fecha_fin?.slice(0, 16).replace("T", " ") || "-"}</div>
              <div className="detalle-row"><b>Duración (min):</b> {finalizarTarea.fecha_fin ? diferenciaEnMinutos(finalizarTarea.fecha_inicio, finalizarTarea.fecha_fin) : "-"}</div>
              <div className="detalle-row"><b>Empresa:</b> {finalizarTarea.empresa?.nombre || "-"}</div>
              <div className="detalle-row"><b>Faena:</b> {finalizarTarea.faena?.nombre || "-"}</div>
              <div className="detalle-row"><b>Ubicación:</b> {finalizarTarea.ubicacion?.nombre || "-"}</div>
              <div className="detalle-row"><b>Operador:</b> {nombreUsuario(finalizarTarea.operador)}</div>
              <div className="detalle-row"><b>Personas Involucradas:</b>{" "}
                {finalizarTarea.personas_involucradas?.length
                  ? finalizarTarea.personas_involucradas.map(nombreUsuario).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Vehículos:</b>{" "}
                {finalizarTarea.vehiculos?.length
                  ? finalizarTarea.vehiculos.map((v: any) => v.nombre).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Herramientas:</b>{" "}
                {finalizarTarea.herramientas?.length
                  ? finalizarTarea.herramientas.map((h: any) => h.nombre).join(", ")
                  : "-"}
              </div>
              <div className="detalle-row"><b>Observaciones:</b> {finalizarTarea.observaciones || "-"}</div>
              <div className="detalle-row">
                <b>Foto de inicio:</b><br />
                {finalizarTarea.foto_inicio
                  ? <img src={finalizarTarea.foto_inicio} alt="Inicio" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover", margin: "4px 0", border: "1px solid #eee" }} />
                  : <span style={{ color: "#bbb" }}>-</span>}
              </div>
              <div className="detalle-row">
                <b>Foto de finalización:</b><br />
                {finalizarTarea.foto_fin
                  ? <img src={finalizarTarea.foto_fin} alt="Fin" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover", margin: "4px 0", border: "1px solid #eee" }} />
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
      </div>
    </Layout>
  );
}



