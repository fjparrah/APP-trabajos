import { useEffect, useState, type ChangeEvent } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "./NuevaTarea.css";

type Entidad = {
  faena?: number;
  id: number;
  nombre: string;
  empresa?: number;
  patente?: string;      // para vehiculos
  descripcion?: string;  // para vehiculos
};
type User = {
  id: number;
  username: string;
  is_superuser?: boolean;
  nombre_completo?: string;
  perfil?: {
    empresa?: { id: number; nombre: string };
    faena?: { id: number; nombre: string; empresa: number };
    rol?: string;
  };
};

export default function NuevaTarea() {
  const [descripcion, setDescripcion] = useState("");
  const [empresa, setEmpresa] = useState<number | null>(null);
  const [faena, setFaena] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState<number | null>(null);
  const [operador, setOperador] = useState<number | null>(null);
  const [personas, setPersonas] = useState<number[]>([]);
  const [vehiculos, setVehiculos] = useState<number[]>([]);
  const [herramientas, setHerramientas] = useState<number[]>([]);
  const [fotoInicio, setFotoInicio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Datos completos desde backend
  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [faenas, setFaenas] = useState<Entidad[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Entidad[]>([]);
  const [operadores, setOperadores] = useState<User[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [vehiculosList, setVehiculosList] = useState<Entidad[]>([]);
  const [herramientasList, setHerramientasList] = useState<Entidad[]>([]);

  // Usuario actual
  const [usuarioActual, setUsuarioActual] = useState<User | null>(null);

  // --- Cargar datos iniciales: empresas, faenas, ubicaciones, usuario actual ---
  useEffect(() => {
    const access = localStorage.getItem("access");
    const cfg = { headers: { Authorization: `Bearer ${access}` } };
    Promise.all([
      axios.get("/api/core/empresas/", cfg),
      axios.get("/api/core/faenas/", cfg),
      axios.get("/api/core/ubicaciones/", cfg),
      axios.get("/api/core/me/", cfg),
    ])
      .then(([empRes, faeRes, ubiRes, meRes]) => {
        setEmpresas(empRes.data);
        setFaenas(faeRes.data);
        setUbicaciones(ubiRes.data);
        setUsuarioActual(meRes.data);

        if (meRes.data.is_superuser) return;
        if (meRes.data.perfil?.rol === "ADMIN" && !meRes.data.perfil?.faena) {
          setEmpresa(meRes.data.perfil?.empresa?.id ?? null);
          setFaena(null);
        }
        if (meRes.data.perfil?.rol === "ADMIN" && meRes.data.perfil?.faena) {
          setEmpresa(meRes.data.perfil?.empresa?.id ?? null);
          setFaena(meRes.data.perfil?.faena?.id ?? null);
        }
        if (meRes.data.perfil?.rol === "OPERADOR") {
          setEmpresa(meRes.data.perfil?.empresa?.id ?? null);
          setFaena(meRes.data.perfil?.faena?.id ?? null);
          setOperador(meRes.data.id);
        }
      });
  }, []);

  // --- Cargar vehículos y herramientas según empresa y faena ---
  useEffect(() => {
    const fetchDatos = async () => {
      if (!empresa) {
        setVehiculosList([]);
        setHerramientasList([]);
        return;
      }
      const access = localStorage.getItem("access");
      const cfg = { headers: { Authorization: `Bearer ${access}` } };
      let vehUrl = `/api/core/vehiculos/?empresa_id=${empresa}`;
      let herUrl = `/api/core/herramientas/?empresa_id=${empresa}`;
      if (faena) {
        vehUrl += `&faena_id=${faena}`;
        herUrl += `&faena_id=${faena}`;
      }
      const [vehRes, herRes] = await Promise.all([
        axios.get(vehUrl, cfg),
        axios.get(herUrl, cfg),
      ]);
      setVehiculosList(vehRes.data);
      setHerramientasList(herRes.data);
    };
    if (empresa) fetchDatos();
    else {
      setVehiculosList([]);
      setHerramientasList([]);
    }
  }, [empresa, faena]);

  // --- Cargar operadores según empresa/faena seleccionada ---
  useEffect(() => {
    const fetchOperadores = async () => {
      if (!empresa) {
        setOperadores([]);
        return;
      }
      const access = localStorage.getItem("access");
      const cfg = { headers: { Authorization: `Bearer ${access}` } };
      let url = `/api/core/users/?empresa_id=${empresa}`;
      if (faena) url += `&faena_id=${faena}`;
      const res = await axios.get(url, cfg);
      setOperadores(res.data);
      if (!res.data.some((u: User) => u.id === operador)) {
        setOperador(null);
      }
    };
    if (usuarioActual?.is_superuser || usuarioActual?.perfil?.rol === "ADMIN") {
      if (empresa) fetchOperadores();
      else setOperadores([]);
    } else if (usuarioActual) {
      setOperadores([usuarioActual]);
    }
  }, [empresa, faena, usuarioActual]);

  // --- Cargar todos los usuarios para personas involucradas ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      const access = localStorage.getItem("access");
      const cfg = { headers: { Authorization: `Bearer ${access}` } };
      const res = await axios.get("/api/core/users/", cfg);
      setUsuarios(res.data);
    };
    fetchUsuarios();
  }, []);

  // --- Filtrado de faenas y ubicaciones según empresa/faena seleccionada ---
  const faenasFiltradas = empresa
    ? faenas.filter(f => f.empresa === empresa)
    : faenas;

  const ubicacionesFiltradas = faena
    ? ubicaciones.filter(u => {
        if (typeof u.faena === "object" && u.faena !== null) {
          return u.faena.id === faena;
        }
        return u.faena === faena;
      })
    : ubicaciones;

  // --- Filtrado de empresas: admin ve todas, operador solo la suya (y bloqueado) ---
  const empresasFiltradas = usuarioActual?.is_superuser
    ? empresas
    : empresas.filter(e => e.id === usuarioActual?.perfil?.empresa?.id);

  const esSuperAdmin = usuarioActual?.is_superuser;
  const esAdminEmpresa = usuarioActual?.perfil?.rol === "ADMIN" && !usuarioActual?.perfil?.faena;
  const esAdminFaena = usuarioActual?.perfil?.rol === "ADMIN" && !!usuarioActual?.perfil?.faena;
  const esOperador = usuarioActual?.perfil?.rol === "OPERADOR";

  // --- Submit ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoInicio(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const access = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("empresa_id", String(empresa));
      formData.append("faena_id", String(faena));
      formData.append("ubicacion_id", String(ubicacion));
      formData.append("operador_id", String(operador));
      personas.forEach(p => formData.append("personas_involucradas_ids", String(p)));
      vehiculos.forEach(v => formData.append("vehiculos_ids", String(v)));
      herramientas.forEach(h => formData.append("herramientas_ids", String(h)));
      formData.append("descripcion", descripcion);
      formData.append("estado", "INICIADA");
      formData.append("fecha_inicio", new Date().toISOString());
      if (fotoInicio) formData.append("foto_inicio", fotoInicio);

      await axios.post(
        "/api/core/tareas/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSuccess("Tarea creada exitosamente 🎉");
      setTimeout(() => (window.location.href = "/tareas"), 1200);
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(
          "Error: " +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        setError("Error al crear la tarea. Verifica todos los campos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="nueva-tarea-container">
        <h2>Crear Nueva Tarea</h2>
        <form onSubmit={handleSubmit} className="nueva-tarea-form" encType="multipart/form-data">
          <label>
            Empresa:
            <select
              value={empresa ?? ""}
              onChange={e => {
                setEmpresa(Number(e.target.value));
                setFaena(null);
                setOperador(null);
              }}
              required
              disabled={!esSuperAdmin}
            >
              <option value="">Selecciona empresa</option>
              {empresasFiltradas.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Faena:
            <select
              value={faena ?? ""}
              onChange={e => {
                setFaena(Number(e.target.value));
                setOperador(null);
              }}
              required
              disabled={esOperador || esAdminFaena}
            >
              <option value="">Selecciona faena</option>
              {faenasFiltradas.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Ubicación:
            <select value={ubicacion ?? ""} onChange={e => setUbicacion(Number(e.target.value))} required>
              <option value="">Selecciona ubicación</option>
              {ubicacionesFiltradas.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </label>
          {/* --- Operador --- */}
          <label>
            Operador:
            <select
              value={operador ?? ""}
              onChange={e => setOperador(Number(e.target.value))}
              required
              disabled={esOperador}
            >
              <option value="">Selecciona operador</option>
              {operadores.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo ? u.nombre_completo : u.username}
                </option>
              ))}
            </select>
          </label>
          {/* --- Personas Involucradas --- */}
          <label>
            Personas Involucradas:
            <select multiple value={personas.map(String)} onChange={e => {
              const values = Array.from(e.target.selectedOptions, o => Number(o.value));
              setPersonas(values);
            }}>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo ? u.nombre_completo : u.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vehículos:
            <select multiple value={vehiculos.map(String)} onChange={e => {
              const values = Array.from(e.target.selectedOptions, o => Number(o.value));
              setVehiculos(values);
            }}>
              {vehiculosList.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Herramientas:
            <select multiple value={herramientas.map(String)} onChange={e => {
              const values = Array.from(e.target.selectedOptions, o => Number(o.value));
              setHerramientas(values);
            }}>
              {herramientasList.map(h => (
                <option key={h.id} value={h.id}>{h.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Foto de inicio:
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <label>
            Descripción:
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button className="crear-btn" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Crear Tarea"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
