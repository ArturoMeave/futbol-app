"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AnilloProgreso from "@/lib/AnilloProgreso";

interface JugadorConNota {
  id: string;
  nombre: string;
  posicion: string;
  notaPosicion: number;
  numVotos: number;
  confirmado: boolean;
}

interface Resultado {
  equipoA: JugadorConNota[];
  equipoB: JugadorConNota[];
  totalA: number;
  totalB: number;
  diferencia: number;
  error?: string;
}

interface TurnoOpt {
  id: string;
  nombre: string;
  activo: boolean;
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

function EquiposContenido() {
  const params = useSearchParams();
  const [turnos, setTurnos] = useState<TurnoOpt[]>([]);
  const [turnoActual, setTurnoActual] = useState(params.get("turno") ?? "");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargandoTurnos, setCargandoTurnos] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoMsg, setGuardadoMsg] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [historialExpandido, setHistorialExpandido] = useState<number | null>(
    null,
  );
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    // 1. Buscamos nuestra nueva llave en el bolsillo del navegador
    const token = sessionStorage.getItem("admin-secret");
    // 2. Si existe (es decir, si hay texto), activamos el modo admin
    setEsAdmin(!!token);
  }, []);

  useEffect(() => {
    fetch("/api/turnos")
      .then((r) => r.json())
      .then((data: TurnoOpt[]) => {
        setTurnos(data);
        if (!turnoActual && data.length > 0) {
          const primerActivo = data.find((t) => t.activo !== false) ?? data[0];
          setTurnoActual(primerActivo.id);
        }
        setCargandoTurnos(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generar() {
    if (!turnoActual) return;
    setGenerando(true);
    setResultado(null);
    const r = await fetch(`/api/equipos?turno=${turnoActual}`);
    const data = await r.json();
    setResultado(data);
    setGenerando(false);
  }

  async function cargarHistorial() {
    if (!turnoActual) return;
    setCargandoHistorial(true);
    const r = await fetch(`/api/historial?turno=${turnoActual}&limit=10`);
    if (r.ok) {
      const data = await r.json();
      setHistorial(data);
    } else {
      setHistorial([]);
    }
    setCargandoHistorial(false);
  }

  useEffect(() => {
    if (!turnoActual || cargandoTurnos) return;
    cargarHistorial();
    setResultado(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoActual, cargandoTurnos]);

  const turnosActivos = turnos.filter((t) => t.activo !== false);
  const turnoNombre =
    turnos.find((t) => t.id === turnoActual)?.nombre ?? "Turno";

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

  if (cargandoTurnos)
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Equipos</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(15,157,88,0.12)",
              borderTopColor: "var(--acento)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      </div>
    );

  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1>Equipos — {turnoNombre}</h1>
      <p className="subtitulo">
        Genera el reparto con los jugadores confirmados del turno
      </p>

      {/* Selector de turno */}
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
              onClick={() => setTurnoActual(t.id)}
              style={
                t.id === turnoActual
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

      {/* Botón generar */}
      <div
        className="tarjeta animar-entrada animar-retraso-2"
        style={{ textAlign: "center" }}
      >
        <button onClick={generar} disabled={generando || !turnoActual}>
          {generando
            ? "Calculando..."
            : resultado && !resultado.error
              ? "Regenerar equipos"
              : "Generar equipos"}
        </button>
      </div>

      {/* Error */}
      {resultado?.error && (
        <div className="tarjeta animar-entrada animar-retraso-2">
          <p className="subtitulo" style={{ margin: 0 }}>
            {resultado.error}
          </p>
        </div>
      )}

      {/* Resultado */}
      {resultado && !resultado.error && (
        <>
          <div
            className="tarjeta"
            style={{
              textAlign: "center",
              marginBottom: 16,
              animation: "entrar 0.4s ease-out both",
            }}
          >
            <span className="subtitulo" style={{ margin: 0, display: "block" }}>
              Diferencia entre equipos
            </span>
            <strong
              style={{
                fontFamily: "var(--font-fraunces), serif",
                fontSize: "2rem",
                fontWeight: 600,
                color:
                  resultado.diferencia === 0 ? "var(--acento)" : "var(--texto)",
                display: "block",
                marginTop: 4,
              }}
            >
              {resultado.diferencia} pts
            </strong>
            {resultado.diferencia === 0 && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--acento)",
                  background: "var(--verde-niebla)",
                  padding: "3px 12px",
                  borderRadius: 999,
                }}
              >
                Equipos perfectos
              </span>
            )}
          </div>

          <div
            className="equipos-grid"
            key={resultado.equipoA.length + "-" + resultado.equipoB.length}
          >
            <div
              className="tarjeta"
              style={{ animation: "entrar 0.5s ease-out both" }}
            >
              <div className="total-equipo">Equipo A — {resultado.totalA}</div>
              {resultado.equipoA.map((j, i) => (
                <div
                  className="jugador-fila"
                  key={j.id}
                  style={{
                    animation: `entrar 0.4s ease-out ${0.05 * i}s both`,
                  }}
                >
                  <span>
                    {j.nombre}
                    <span className={`chip chip-${j.posicion}`}>
                      {j.posicion}
                    </span>
                  </span>
                  <AnilloProgreso
                    valor={j.notaPosicion}
                    size={44}
                    grosor={4}
                    color="var(--acento)"
                  />
                </div>
              ))}
            </div>

            <div
              className="tarjeta"
              style={{ animation: "entrar 0.5s ease-out 0.1s both" }}
            >
              <div className="total-equipo">Equipo B — {resultado.totalB}</div>
              {resultado.equipoB.map((j, i) => (
                <div
                  className="jugador-fila"
                  key={j.id}
                  style={{
                    animation: `entrar 0.4s ease-out ${0.05 * i + 0.1}s both`,
                  }}
                >
                  <span>
                    {j.nombre}
                    <span className={`chip chip-${j.posicion}`}>
                      {j.posicion}
                    </span>
                  </span>
                  <AnilloProgreso
                    valor={j.notaPosicion}
                    size={44}
                    grosor={4}
                    color="var(--acento)"
                  />
                </div>
              ))}
            </div>
          </div>

          {esAdmin && (
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <button
                className="boton-secundario"
                onClick={async () => {
                  setGuardando(true);
                  setGuardadoMsg(null);
                  const ligero = (arr: any[]) =>
                    arr.map((j) => ({
                      id: j.id,
                      nombre: j.nombre,
                      posicion: j.posicion,
                      notaPosicion: j.notaPosicion,
                    }));
                  const r = await fetch("/api/historial", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      // 1. Leemos la llave del bolsillo en el momento exacto de enviarla
                      "x-admin-secret":
                        sessionStorage.getItem("admin-secret") || "",
                    },
                    body: JSON.stringify({
                      turnoId: turnoActual,
                      turnoNombre,
                      totalA: resultado.totalA,
                      totalB: resultado.totalB,
                      diferencia: resultado.diferencia,
                      equipoA: ligero(resultado.equipoA),
                      equipoB: ligero(resultado.equipoB),
                    }),
                  });
                  setGuardando(false);
                  setGuardadoMsg(
                    r.ok ? "Guardado en historial ✅" : "Error al guardar",
                  );
                  setTimeout(() => setGuardadoMsg(null), 2500);
                  cargarHistorial();
                }}
                disabled={guardando}
                style={{ fontSize: "0.85rem", padding: "10px 16px" }}
              >
                {guardando ? "Guardando..." : "Guardar en historial"}
              </button>
              {guardadoMsg && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.82rem",
                    color: "var(--acento)",
                  }}
                >
                  {guardadoMsg}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dashboard historial anterior */}
      <div className="tarjeta animar-entrada animar-retraso-3">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Partidas anteriores</h2>
          <button
            className="copiar-btn"
            onClick={cargarHistorial}
            disabled={cargandoHistorial}
            style={{ fontSize: "0.72rem" }}
          >
            {cargandoHistorial ? "Cargando..." : "Refrescar"}
          </button>
        </div>
        {historial.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Aún no hay equipos guardados de este turno. Genera uno y guárdalo
            como referencia.
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

export default function EquiposPage() {
  return (
    <Suspense
      fallback={
        <div className="contenedor">
          <div className="marca">
            <span className="punto" />
            Fútbol Viernes
          </div>
          <p className="subtitulo">Cargando...</p>
        </div>
      }
    >
      <EquiposContenido />
    </Suspense>
  );
}
