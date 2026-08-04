"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface HistorialItem {
  id: number;
  turnoId: string;
  turnoNombre: string;
  fecha: number;
  totalA: number;
  totalB: number;
  diferencia: number;
  equipoA: {
    id: string;
    nombre: string;
    posicion: string;
    notaPosicion: number;
  }[];
  equipoB: {
    id: string;
    nombre: string;
    posicion: string;
    notaPosicion: number;
  }[];
}

export default function SemanaPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [toggleTurno, setToggleTurno] = useState("");
  const [togglandoId, setTogglandoId] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [historialExpandido, setHistorialExpandido] = useState<number | null>(
    null,
  );

  useEffect(() => {
    // 1. Buscamos si ya introducimos la contraseña antes
    let tokenGuardado = sessionStorage.getItem("admin-secret");

    // 2. Si no la tenemos, se la pedimos al usuario
    if (!tokenGuardado) {
      tokenGuardado = prompt("Introduce la contraseña de administrador:");
      // 3. Si escribe algo, lo guardamos en su sesión
      if (tokenGuardado) {
        sessionStorage.setItem("admin-secret", tokenGuardado);
      }
    }

    // 4. Le dejamos ver la pantalla, pero el servidor decidirá si sus acciones funcionan
    setAutenticado(true);
  }, []);

  async function adminFetch(url: string, opts: RequestInit = {}) {
    // 5. Recuperamos la llave guardada
    const token = sessionStorage.getItem("admin-secret") || "";

    // 6. Enviamos al cartero con la llave en la mano
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "x-admin-secret": token,
      },
    });

    // 7. Si el servidor nos rechaza la llave...
    if (res.status === 401) {
      alert(
        "Contraseña incorrecta o caducada. Recarga la página para intentarlo de nuevo.",
      );
      sessionStorage.removeItem("admin-secret");
    }

    return res;
  }

  function cargar() {
    setCargando(true);
    Promise.all([
      fetch("/api/jugadores").then((r) => r.json()),
      fetch("/api/turnos").then((r) => r.json()),
    ]).then(([js, ts]: [Jugador[], Turno[]]) => {
      setJugadores(js);
      setTurnos(ts);
      if (ts.length > 0 && !toggleTurno) {
        const primerActivo = ts.find((t) => t.activo) ?? ts[0];
        setToggleTurno(primerActivo.id);
      }
      setCargando(false);
    });
  }

  useEffect(() => {
    if (!autenticado) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado || !toggleTurno) return;
    fetch(`/api/historial?turno=${toggleTurno}&limit=5`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHistorial(data));
  }, [autenticado, toggleTurno]);

  async function toggleConfirmado(j: Jugador) {
    setTogglandoId(j.id);
    await adminFetch("/api/jugadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: j.id, confirmado: !j.confirmado }),
    });
    setTogglandoId(null);
    setJugadores((prev) =>
      prev.map((x) =>
        x.id === j.id ? { ...x, confirmado: !j.confirmado } : x,
      ),
    );
  }

  if (!autenticado) {
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Acceso restringido</h1>
        <p className="subtitulo">Necesitas la contraseña de admin.</p>
      </div>
    );
  }

  const turnosActivos = turnos.filter((t) => t.activo !== false);
  const jugadoresToggle = jugadores.filter((j) => j.turno === toggleTurno);
  const confirmadosToggle = jugadoresToggle.filter((j) => j.confirmado).length;
  const turnoNombre =
    turnos.find((t) => t.id === toggleTurno)?.nombre ?? "Turno";
  const suficientes = confirmadosToggle >= 2;

  function formatearFecha(ms: number) {
    try {
      return new Date(ms).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  return (
    <div className="contenedor">
      <div className="marca animar-entrada">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1 className="animar-entrada animar-retraso-1">Esta semana</h1>
      <p className="subtitulo animar-entrada animar-retraso-1">
        Marca quién juega, genera los equipos y guárdalos.
      </p>

      {/* Resumen */}
      <div className="stat-grid animar-entrada animar-retraso-2">
        <div className="stat-card principal">
          <div>
            <div className="stat-etiqueta">Confirmados — {turnoNombre}</div>
            <div className="stat-sub">
              {suficientes ? "Listos para generar" : "Faltan jugadores"}
            </div>
          </div>
          <div
            className="stat-numero"
            style={{ fontSize: "2.6rem", color: "var(--acento)" }}
          >
            {confirmadosToggle}
            <span
              style={{
                fontSize: "1rem",
                color: "var(--texto-suave)",
                fontWeight: 500,
              }}
            >
              {" "}
              / {jugadoresToggle.length}
            </span>
          </div>
        </div>
      </div>

      {/* Selector turno */}
      {turnosActivos.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {turnosActivos.map((t) => (
            <button
              key={t.id}
              className="copiar-btn"
              onClick={() => setToggleTurno(t.id)}
              style={
                t.id === toggleTurno
                  ? {
                      background: "var(--acento)",
                      color: "#fff",
                      border: "none",
                    }
                  : {}
              }
            >
              {t.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Hoy juega */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2 style={{ marginBottom: 14 }}>Hoy juega</h2>
        {cargando ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Cargando...
          </p>
        ) : jugadoresToggle.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Sin jugadores en este turno. Asigna jugadores desde Admin.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 6,
            }}
          >
            {jugadoresToggle.map((j) => (
              <button
                key={j.id}
                onClick={() => toggleConfirmado(j)}
                disabled={togglandoId === j.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--radio-sm)",
                  border: j.confirmado
                    ? "1px solid rgba(22, 163, 74, 0.3)"
                    : "1px solid var(--cristal-borde)",
                  background: j.confirmado
                    ? "rgba(22, 163, 74, 0.08)"
                    : "transparent",
                  color: j.confirmado ? "#16a34a" : "var(--texto)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  width: "100%",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {j.nombre}
                  <span className={`chip chip-${j.posicion}`}>
                    {j.posicion}
                  </span>
                </span>
                <span>{j.confirmado ? "✓ Voy" : "No voy"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Acción equipos */}
      <div
        className="tarjeta animar-entrada animar-retraso-2"
        style={{ textAlign: "center" }}
      >
        <h2 style={{ marginBottom: 8 }}>Equipos</h2>
        <p
          className="subtitulo"
          style={{ marginBottom: 16, fontSize: "0.9rem" }}
        >
          {suficientes
            ? "Genera el reparto equilibrado con los confirmados."
            : "Necesitas al menos 2 confirmados."}
        </p>
        <Link href={suficientes ? `/equipos?turno=${toggleTurno}` : "#"}>
          <button disabled={!suficientes}>
            {suficientes ? "Generar / ver equipos →" : "Faltan confirmados"}
          </button>
        </Link>
      </div>

      {/* Historial reciente */}
      <div className="tarjeta animar-entrada animar-retraso-3">
        <h2 style={{ marginBottom: 14 }}>
          Partidas anteriores — {turnoNombre}
        </h2>
        {historial.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Sin partidas guardadas todavía.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historial.map((h) => (
              <div
                key={h.id}
                style={{
                  border: "1px solid var(--cristal-borde)",
                  borderRadius: "var(--radio-sm)",
                  padding: 12,
                }}
              >
                <button
                  onClick={() =>
                    setHistorialExpandido(
                      historialExpandido === h.id ? null : h.id,
                    )
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--texto)",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  <span>{formatearFecha(h.fecha)}</span>
                  <span
                    style={{
                      color:
                        h.diferencia === 0
                          ? "var(--acento)"
                          : "var(--texto-suave)",
                      fontSize: "0.8rem",
                    }}
                  >
                    A {h.totalA} — B {h.totalB} (Δ {h.diferencia})
                  </span>
                </button>
                {historialExpandido === h.id && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--texto-suave)",
                          marginBottom: 6,
                        }}
                      >
                        Equipo A — {h.totalA}
                      </div>
                      {h.equipoA.map((j) => (
                        <div
                          key={j.id}
                          style={{
                            fontSize: "0.82rem",
                            marginBottom: 2,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {j.nombre}{" "}
                            <span
                              className={`chip chip-${j.posicion}`}
                              style={{ fontSize: "0.6rem" }}
                            >
                              {j.posicion}
                            </span>
                          </span>
                          <span style={{ color: "var(--texto-suave)" }}>
                            {j.notaPosicion}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--texto-suave)",
                          marginBottom: 6,
                        }}
                      >
                        Equipo B — {h.totalB}
                      </div>
                      {h.equipoB.map((j) => (
                        <div
                          key={j.id}
                          style={{
                            fontSize: "0.82rem",
                            marginBottom: 2,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {j.nombre}{" "}
                            <span
                              className={`chip chip-${j.posicion}`}
                              style={{ fontSize: "0.6rem" }}
                            >
                              {j.posicion}
                            </span>
                          </span>
                          <span style={{ color: "var(--texto-suave)" }}>
                            {j.notaPosicion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
