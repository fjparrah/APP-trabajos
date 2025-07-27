import { useEffect, useState } from "react";
import axios from "axios";
import "./TaskModal.css";

type User = { id: number; username: string; nombre_completo?: string };
type Entidad = { id: number; nombre: string };

type Tarea = {
  id: number;
  descripcion: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  operador?: User;
  empresa?: Entidad;
  faena?: Entidad;
  ubicacion?: Entidad;
  personas_involucradas?: User[];
  vehiculos?: Entidad[];
  herramientas?: Entidad[];
  foto_inicio?: string;
  foto_fin?: string;
  observaciones?: string;
};

type Props = {
  tarea: Tarea;
  onClose: () => void;
  onFinalizada?: (tareaId: number) => void;
  modoFinalizar?: boolean;
  modoEditar?: boolean;
  onEditada?: () => void;
};

export default function TaskModal({
  tarea,
  onClose,
  onFinalizada,
  modoFinalizar,
  modoEditar,
  onEditada,
}: Props) {
  // ---- ESTADO EDICIÓN ----
  const [descripcion, setDescripcion] = useState(tarea.descripcion);
  const [operador, setOperador] = useState<number>(tarea.operador?.id ?? 0);
  const [personas, setPersonas] = useState<number[]>(tarea.personas_involucradas?.map(p => p.id) ?? []);
  const [vehiculos, setVehiculos] = useState<number[]>(tarea.vehiculos?.map(v => v.id) ?? []);
  const [herramientas, setHerramientas] = useState<number[]>(tarea.herramientas?.map(h => h.id) ?? []);
  const [observaciones, setObservaciones] = useState(tarea.observaciones ?? "");

  // Para selects
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [vehiculosList, setVehiculosList] = useState<Entidad[]>([]);
  const [herramientasList, setHerramientasList] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Para finalizar tarea
  const [fotoFin, setFotoFin] = useState<File | null>(null);

  // Zoom imagen
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  useEffect(() => {
    if (modoEditar) {
      const access = localStorage.getItem("access");
      const cfg = { headers: { Authorization: `Bearer ${access}` } };
      Promise.all([
        axios.get("/api/core/users/", cfg),
        axios.get(`/api/core/vehiculos/?empresa_id=${tarea.empresa?.id}` + (tarea.faena ? `&faena_id=${tarea.faena.id}` : ""), cfg),
        axios.get(`/api/core/herramientas/?empresa_id=${tarea.empresa?.id}` + (tarea.faena ? `&faena_id=${tarea.faena.id}` : ""), cfg),
      ]).then(([usuariosRes, vehiculosRes, herramientasRes]) => {
        setUsuarios(usuariosRes.data);
        setVehiculosList(vehiculosRes.data);
        setHerramientasList(herramientasRes.data);
      });
    }
  }, [modoEditar, tarea.empresa?.id, tarea.faena?.id]);

  // PATCH para finalizar tarea
  const finalizarTarea = async () => {
    if (!fotoFin) {
      setError("Debes subir la foto de finalización.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const access = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("estado", "FINALIZADA");
      formData.append("fecha_fin", new Date().toISOString());
      formData.append("foto_fin", fotoFin);
      formData.append("observaciones", observaciones);

      await axios.patch(
        `/api/core/tareas/${tarea.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (onFinalizada) onFinalizada(tarea.id);
      onClose();
    } catch (err) {
      setError("No se pudo finalizar la tarea.");
    } finally {
      setLoading(false);
    }
  };

  // PATCH para editar tarea
  const editarTarea = async () => {
    setError("");
    setLoading(true);
    try {
      const access = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("descripcion", descripcion);
      formData.append("observaciones", observaciones);
      formData.append("operador_id", String(operador));
      personas.forEach(p => formData.append("personas_involucradas_ids", String(p)));
      vehiculos.forEach(v => formData.append("vehiculos_ids", String(v)));
      herramientas.forEach(h => formData.append("herramientas_ids", String(h)));

      await axios.patch(
        `/api/core/tareas/${tarea.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (onEditada) onEditada();
      onClose();
    } catch (err) {
      setError("No se pudo editar la tarea.");
    } finally {
      setLoading(false);
    }
  };

  // Manejo para fotos
  const fotoURL = (img: string | undefined) => {
    if (!img) return undefined;
    if (img.startsWith("http")) return img;
    return img.startsWith("/media/") ? img : `/media/${img}`;
  };

  // -------- FORMULARIO EDICIÓN --------
  if (modoEditar) {
    return (
      <div className="modal-bg" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={onClose} title="Cerrar">&times;</button>
          <h3>Editar Tarea #{tarea.id}</h3>
          <div className="modal-section">
            <label>
              Descripción:<br />
              <input value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ width: "100%" }} />
            </label>
          </div>
          <div className="modal-section">
            <label>
              Operador:<br />
              <select value={operador} onChange={e => setOperador(Number(e.target.value))}>
                <option value="">Selecciona operador</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre_completo || u.username}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-section">
            <label>
              Personas involucradas:<br />
              <select multiple value={personas.map(String)} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => Number(o.value));
                setPersonas(values);
              }}>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre_completo || u.username}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-section">
            <label>
              Vehículos:<br />
              <select multiple value={vehiculos.map(String)} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => Number(o.value));
                setVehiculos(values);
              }}>
                {vehiculosList.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-section">
            <label>
              Herramientas:<br />
              <select multiple value={herramientas.map(String)} onChange={e => {
                const values = Array.from(e.target.selectedOptions, o => Number(o.value));
                setHerramientas(values);
              }}>
                {herramientasList.map(h => (
                  <option key={h.id} value={h.id}>{h.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="modal-section">
            <label>
              Observaciones:<br />
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} style={{ width: "100%" }} />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="fin-btn" onClick={editarTarea} disabled={loading} style={{marginTop: 10}}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button onClick={onClose} className="cerrar-btn" style={{marginLeft: 10}}>Cancelar</button>
        </div>
      </div>
    );
  }

  // -------- VISTA NORMAL Y FINALIZAR --------
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} title="Cerrar">&times;</button>
        <h3>
          {modoFinalizar ? "Finalizar Tarea" : `Detalle de Tarea #${tarea.id}`}
        </h3>
        <div className="modal-grid">
          <div className="modal-info">
            <div><b>Descripción:</b> {tarea.descripcion}</div>
            <div><b>Estado:</b> {tarea.estado}</div>
            <div><b>Inicio:</b> {tarea.fecha_inicio?.slice(0, 16).replace("T", " ")}</div>
            <div><b>Fin:</b> {tarea.fecha_fin?.slice(0, 16).replace("T", " ") || "-"}</div>
            <div><b>Operador:</b> {typeof tarea.operador === "object" ? tarea.operador.username : tarea.operador}</div>
            <div><b>Empresa:</b> {tarea.empresa?.nombre || tarea.empresa}</div>
            <div><b>Faena:</b> {tarea.faena?.nombre || tarea.faena}</div>
            <div><b>Ubicación:</b> {tarea.ubicacion?.nombre || tarea.ubicacion}</div>
            <div><b>Personas Involucradas:</b> {(tarea.personas_involucradas ?? []).map((p: any) => p.username || p).join(", ") || "-"}</div>
            <div><b>Vehículos:</b> {(tarea.vehiculos ?? []).map((v: any) => v.nombre || v).join(", ") || "-"}</div>
            <div><b>Herramientas:</b> {(tarea.herramientas ?? []).map((h: any) => h.nombre || h).join(", ") || "-"}</div>
            <div><b>Observaciones:</b> {tarea.observaciones ?? "-"}</div>
          </div>
          <div className="modal-fotos">
            <div>
              <b>Foto de inicio:</b><br />
              {tarea.foto_inicio ? (
                <img
                  src={fotoURL(tarea.foto_inicio)}
                  alt="Inicio"
                  className="modal-mini-img"
                  onClick={() => setZoomImg(fotoURL(tarea.foto_inicio)!)}
                  title="Ver grande"
                />
              ) : (
                <div className="modal-img-placeholder">Sin foto</div>
              )}
            </div>
            <div>
              <b>Foto de finalización:</b><br />
              {tarea.foto_fin ? (
                <img
                  src={fotoURL(tarea.foto_fin)}
                  alt="Fin"
                  className="modal-mini-img"
                  onClick={() => setZoomImg(fotoURL(tarea.foto_fin)!)}
                  title="Ver grande"
                />
              ) : (
                <div className="modal-img-placeholder">Sin foto</div>
              )}
            </div>
          </div>
        </div>

        {/* Solo en modo finalizar */}
        {modoFinalizar && (
          <>
            <div className="modal-section">
              <b>Sube la foto de finalización:</b>
              <input type="file" accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) setFotoFin(e.target.files[0]);
                }}
              />
            </div>
            <div className="modal-section">
              <b>Observaciones (opcional):</b>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button onClick={finalizarTarea} disabled={loading} className="fin-btn" style={{marginTop: 8}}>
              {loading ? "Finalizando..." : "Finalizar Tarea"}
            </button>
          </>
        )}

        <button onClick={onClose} className="cerrar-btn">Cerrar</button>
        {zoomImg && (
          <div className="modal-img-zoom-bg" onClick={() => setZoomImg(null)}>
            <img src={zoomImg} alt="Grande" className="modal-img-zoom" />
          </div>
        )}
      </div>
    </div>
  );
}


