"use client";

import { useEffect, useState } from "react";

interface Jugador {
  id: string;
  nombre: string;
  posicion: "POR" | "DEF" | "MED" | "DEL";
  turno: string;
  token: string;
  confirmado: boolean;
  votosHechos: number;
  totalPosibles: number;
}

interface Turno {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState<Jugador["posicion"]>("MED");
  const [turno, setTurno] = useState("");
  const [origen, setOrigen] = useState("");
  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [reseteando, setReseteando] = useState(false);

  const [nuevoTurnoNombre, setNuevoTurnoNombre] = useState("");

  useEffect(() => {
    const secreto = process.env.NEXT_PUBLIC_ADMIN_SECRET;
    if (!secreto) {
      setAutenticado(true);
      return;
    }
    if (sessionStorage.getItem("admin-ok") === "1") {
      setAutenticado(true);
      return;
    }
    const intento = prompt("Contraseña de admin:");
    if (intento === secreto) {
      sessionStorage.setItem("admin-ok", "1");
      setAutenticado(true);
    } else {
      alert("Contraseña incorrecta");
    }
  }, []);

  async function adminFetch(url: string, opts: RequestInit = {}) {
    return fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
      },
    });
  }

  function cargar() {
    setCargando(true);
    Promise.all([
      fetch("/api/jugadores").then((r) => r.json()),
      fetch("/api/turnos").then((r) => r.json()),
    ]).then(([js, ts]) => {
      setJugadores(js);
      setTurnos(ts);
      if (ts.length > 0 && !turno) setTurno(ts[0].id);
      setCargando(false);
    });
  }

  useEffect(() => {
    if (!autenticado) return;
    cargar();
    setOrigen(window.location.origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  if (!autenticado) {
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Acceso restringido</h1>
        <p className="subtitulo">Necesitas la contraseña de admin para entrar.</p>
      </div>
    );
  }

  async function agregar() {
    if (!nombre.trim()) return;
    setAgregando(true);
    await adminFetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, posicion, turno }),
    });
    setNombre("");
    setAgregando(false);
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este jugador y todos sus votos?")) return;
    await adminFetch(`/api/jugadores?id=${id}`, { method: "DELETE" });
    cargar();
  }

  async function nuevaSemana() {
    if (!confirm("¿Iniciar nueva semana? Se reinician las confirmaciones de asistencia. Los votos se mantienen (se votan una sola vez)."))
      return;
    setReseteando(true);
    await adminFetch("/api/reset", { method: "POST" });
    setReseteando(false);
    cargar();
  }

  async function borrarTodasLasVotaciones() {
    if (!confirm("⚠️ Esto borra TODAS las votaciones de TODOS los jugadores para empezar de cero. ¿Seguro? Esta acción no se puede deshacer."))
      return;
    const segunda = prompt("Para confirmar, escribe REINICIAR:");
    if (segunda !== "REINICIAR") {
      alert("Cancelado. Las votaciones no se han borrado.");
      return;
    }
    setReseteando(true);
    await adminFetch("/api/reset?votos=1", { method: "POST" });
    setReseteando(false);
    cargar();
  }

  async function crearTurno() {
    if (!nuevoTurnoNombre.trim()) return;
    await adminFetch("/api/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoTurnoNombre.trim() }),
    });
    setNuevoTurnoNombre("");
    cargar();
  }

  async function editarTurno(t: Turno) {
    const nombre = prompt("Nombre del turno:", t.nombre);
    if (nombre === null) return;
    await adminFetch("/api/turnos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, nombre, activo: !t.activo }),
    });
    cargar();
  }

  async function borrarTurno(t: Turno) {
    const count = jugadores.filter((j) => j.turno === t.id).length;
    if (!confirm(`¿Borrar el turno "${t.nombre}"?${count > 0 ? ` Tiene ${count} jugador(es).` : ""}`))
      return;
    await adminFetch(`/api/turnos?id=${t.id}`, { method: "DELETE" });
    cargar();
  }

  function copiar(link: string) {
    navigator.clipboard.writeText(link);
    alert("Link copiado ✅");
  }

  const progresoGlobal = () => {
    if (jugadores.length === 0) return 0;
    const total = jugadores.reduce(
      (acc, j) => acc + j.votosHechos / Math.max(1, j.totalPosibles),
      0
    );
    return Math.round((total / jugadores.length) * 100);
  };

  const confirmadosCount = jugadores.filter((j) => j.confirmado).length;

  return (
    <div className="contenedor">
      <div className="marca animar-entrada">
        <span className="punto" />
        Fútbol Viernes
      </div>

      <h1 className="animar-entrada animar-retraso-1">Panel de admin</h1>
      <p className="subtitulo animar-entrada animar-retraso-1">
        Gestiona turnos, jugadores e inicia cada semana.
      </p>

      {/* Gestión de turnos */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2 style={{ marginBottom: 14 }}>Turnos</h2>
        {turnos.map((t) => (
          <div className="link-jugador" key={t.id}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {t.nombre}
              {!t.activo && (
                <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                  (inactivo)
                </span>
              )}
              <span style={{ fontSize: "0.7rem", color: "var(--texto-suave)" }}>
                {jugadores.filter((j) => j.turno === t.id).length} jugadores
              </span>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="copiar-btn"
                onClick={() => editarTurno(t)}
                style={{ fontSize: "0.72rem" }}
              >
                {t.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                className="copiar-btn"
                onClick={() => borrarTurno(t)}
                style={{
                  color: "var(--del-texto)",
                  background: "var(--del-bg)",
                  border: "none",
                }}
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <input
            className="campo-input"
            style={{ flex: 1 }}
            value={nuevoTurnoNombre}
            onChange={(e) => setNuevoTurnoNombre(e.target.value)}
            placeholder="Nuevo turno (ej: Turno 3 — Sábado 18:00)"
            onKeyDown={(e) => e.key === "Enter" && crearTurno()}
          />
          <button
            onClick={crearTurno}
            style={{ width: "auto", padding: "12px 18px", whiteSpace: "nowrap" }}
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Añadir jugador */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2 style={{ marginBottom: 14 }}>Añadir jugador manualmente</h2>
        <div className="fila-atributo" style={{ marginBottom: 12 }}>
          <label>Nombre</label>
          <input
            className="campo-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del jugador"
          />
        </div>
        <div className="fila-atributo" style={{ marginBottom: 12 }}>
          <label>Posición</label>
          <select
            className="campo-select"
            value={posicion}
            onChange={(e) => setPosicion(e.target.value as Jugador["posicion"])}
          >
            <option value="POR">Portero</option>
            <option value="DEF">Defensa</option>
            <option value="MED">Medio</option>
            <option value="DEL">Delantero</option>
          </select>
        </div>
        <div className="fila-atributo" style={{ marginBottom: 20 }}>
          <label>Turno</label>
          <select
            className="campo-select"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <button onClick={agregar} disabled={agregando}>
          {agregando ? "Añadiendo..." : "Añadir jugador"}
        </button>
      </div>

      {/* Progreso global */}
      {jugadores.length > 0 && (
        <div
          className="tarjeta animar-entrada animar-retraso-2"
          style={{ textAlign: "center" }}
        >
          <span
            className="subtitulo"
            style={{ marginBottom: 12, display: "block" }}
          >
            Progreso de votaciones
          </span>
          <div className="progreso">
            <div
              className="progreso-relleno"
              style={{ width: `${progresoGlobal()}%` }}
            />
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--texto-suave)" }}>
            {progresoGlobal()}% completado · {confirmadosCount} confirmados
          </span>
        </div>
      )}

      {/* Nueva semana (solo asistencias) */}
      <div
        className="animar-entrada animar-retraso-3"
        style={{ marginBottom: 12 }}
      >
        <button
          className="boton-secundario"
          onClick={nuevaSemana}
          disabled={reseteando}
          style={{ fontSize: "0.85rem", padding: "10px 16px" }}
        >
          {reseteando ? "Iniciando..." : "Nueva semana — reiniciar asistencias"}
        </button>
      </div>

      {/* Reiniciar votaciones (raro, peligroso) */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={borrarTodasLasVotaciones}
          disabled={reseteando}
          style={{
            width: "100%",
            background: "rgba(220, 38, 38, 0.06)",
            color: "#dc2626",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            padding: "8px 16px",
            borderRadius: "var(--radio-sm)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⚠️ Reiniciar todas las votaciones (empezar de cero)
        </button>
      </div>

      {/* Jugadores por turno */}
      {turnos.map((t) => {
        const js = jugadores.filter((j) => j.turno === t.id);
        return (
          <div key={t.id}>
            <h2 className="animar-entrada animar-retraso-3">
              {t.nombre}{" "}
              <span style={{ fontSize: "0.8rem", color: "var(--texto-suave)" }}>
                ({js.filter((j) => j.confirmado).length}/{js.length} confirmados)
              </span>
            </h2>
            <div className="tarjeta animar-entrada animar-retraso-3">
              {cargando ? (
                <p
                  className="subtitulo"
                  style={{ margin: 0, textAlign: "center" }}
                >
                  Cargando...
                </p>
              ) : js.length === 0 ? (
                <p
                  className="subtitulo"
                  style={{ margin: 0, textAlign: "center" }}
                >
                  Sin jugadores
                </p>
              ) : (
                js.map((j) => (
                  <div className="link-jugador" key={j.id}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {j.nombre}
                      <span className={`chip chip-${j.posicion}`}>
                        {j.posicion}
                      </span>
                      {j.confirmado && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: "#16a34a",
                            background: "rgba(22, 163, 74, 0.12)",
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}
                        >
                          ✓ Voy
                        </span>
                      )}
                      {j.totalPosibles > 0 && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            color:
                              j.votosHechos === j.totalPosibles
                                ? "#16a34a"
                                : "var(--texto-suave)",
                          }}
                        >
                          {j.votosHechos}/{j.totalPosibles}
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="copiar-btn"
                        onClick={() => copiar(`${origen}/votar/${j.token}`)}
                      >
                        Copiar link
                      </button>
                      <button
                        className="copiar-btn"
                        onClick={() => eliminar(j.id)}
                        style={{
                          color: "var(--del-texto)",
                          background: "var(--del-bg)",
                          border: "none",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}