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

function EquiposContenido() {
  const params = useSearchParams();
  const [turnos, setTurnos] = useState<TurnoOpt[]>([]);
  const [turnoActual, setTurnoActual] = useState(
    params.get("turno") ?? ""
  );
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    fetch("/api/turnos")
      .then((r) => r.json())
      .then((data: TurnoOpt[]) => {
        setTurnos(data);
        if (!turnoActual && data.length > 0) {
          setTurnoActual(data[0].id);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generar(t: string) {
    if (!t) return;
    setRegenerando(true);
    setCargando(intentos === 0);
    const r = await fetch(`/api/equipos?turno=${t}`);
    const data = await r.json();
    setResultado(data);
    setCargando(false);
    setRegenerando(false);
    setIntentos((n) => n + 1);
  }

  useEffect(() => {
    if (turnoActual) generar(turnoActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoActual]);

  const turnosActivos = turnos.filter((t) => t.activo !== false);
  const turnoNombre =
    turnos.find((t) => t.id === turnoActual)?.nombre ?? "Turno";

  if (cargando)
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
            minHeight: "50vh",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(26, 122, 76, 0.12)",
                borderTopColor: "var(--verde-primario)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p className="subtitulo" style={{ margin: 0 }}>
              Calculando equipos equilibrados...
            </p>
          </div>
        </div>
      </div>
    );

  if (resultado?.error)
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Equipos — {turnoNombre}</h1>
        <p className="subtitulo">{resultado.error}</p>
        <button
          className="boton-secundario"
          onClick={() => generar(turnoActual)}
          disabled={regenerando}
        >
          {regenerando ? "Recalculando..." : "Reintentar"}
        </button>
      </div>
    );

  const diferencia = resultado?.diferencia ?? 0;
  const diferenciaMenor = diferencia === 0;

  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1>Equipos — {turnoNombre}</h1>
      <p className="subtitulo">
        Reparto equilibrado con los jugadores confirmados
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
                      background: "var(--verde-primario)",
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
            color: diferenciaMenor
              ? "var(--verde-primario)"
              : "var(--verde-texto)",
            display: "block",
            marginTop: 4,
          }}
        >
          {diferencia} pts
        </strong>
        {diferenciaMenor && (
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--verde-primario)",
              background: "var(--verde-niebla)",
              padding: "3px 12px",
              borderRadius: 999,
            }}
          >
            Equipos perfectos
          </span>
        )}
      </div>

      <div className="equipos-grid" key={intentos}>
        <div
          className="tarjeta"
          style={{ animation: "entrar 0.5s ease-out both" }}
        >
          <div className="total-equipo">Equipo A — {resultado?.totalA}</div>
          {resultado?.equipoA.map((j, i) => (
            <div
              className="jugador-fila"
              key={j.id}
              style={{ animation: `entrar 0.4s ease-out ${0.05 * i}s both` }}
            >
              <span>
                {j.nombre}
                <span className={`chip chip-${j.posicion}`}>{j.posicion}</span>
              </span>
              <AnilloProgreso
                valor={j.notaPosicion}
                size={44}
                grosor={4}
                color="var(--verde-primario)"
              />
            </div>
          ))}
        </div>

        <div
          className="tarjeta"
          style={{ animation: "entrar 0.5s ease-out 0.1s both" }}
        >
          <div className="total-equipo">Equipo B — {resultado?.totalB}</div>
          {resultado?.equipoB.map((j, i) => (
            <div
              className="jugador-fila"
              key={j.id}
              style={{
                animation: `entrar 0.4s ease-out ${0.05 * i + 0.1}s both`,
              }}
            >
              <span>
                {j.nombre}
                <span className={`chip chip-${j.posicion}`}>{j.posicion}</span>
              </span>
              <AnilloProgreso
                valor={j.notaPosicion}
                size={44}
                grosor={4}
                color="var(--verde-primario)"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => generar(turnoActual)}
        disabled={regenerando}
        style={{ marginTop: 8 }}
      >
        {regenerando ? "Recalculando..." : "Regenerar equipos"}
      </button>
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