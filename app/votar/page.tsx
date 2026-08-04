"use client";

import { useEffect, useState } from "react";
import AnilloProgreso from "@/lib/AnilloProgreso";
import { POSICIONES, POSICION_LABELS, Posicion } from "@/lib/db";

interface JugadorLista {
  id: string;
  nombre: string;
  posicion: Posicion;
  turnoId: string;
  turnoNombre: string;
}

interface Objetivo {
  id: string;
  nombre: string;
  posicion: string;
}

interface Atributos {
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
}

const ATRIBUTOS_INFO: { key: keyof Atributos; label: string }[] = [
  { key: "ritmo", label: "Ritmo" },
  { key: "resistencia", label: "Resistencia" },
  { key: "tecnica", label: "Técnica" },
  { key: "remate", label: "Remate" },
  { key: "defensa", label: "Defensa" },
];

const STORAGE_KEY = "futbol-votante-id";

export default function VotarUniversalPage() {
  const [fase, setFase] = useState<"identidad" | "votar">("identidad");
  const [jugadores, setJugadores] = useState<JugadorLista[]>([]);
  const [miId, setMiId] = useState<string | null>(null);
  const [miNombre, setMiNombre] = useState<string>("");
  const [cargando, setCargando] = useState(true);

  // Identidad
  const [seleccion, setSeleccion] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    fetch("/api/votar")
      .then((r) => r.json())
      .then((data) => {
        setJugadores(data.jugadores || []);
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) {
          const found = (data.jugadores || []).find((j: JugadorLista) => j.id === guardado);
          if (found) {
            setMiId(found.id);
            setMiNombre(found.nombre);
            setFase("votar");
          }
        }
        setCargando(false);
      });
  }, []);

  function empezar() {
    if (!seleccion) return;
    const j = jugadores.find((x) => x.id === seleccion);
    if (!j) return;
    localStorage.setItem(STORAGE_KEY, j.id);
    setMiId(j.id);
    setMiNombre(j.nombre);
    setFase("votar");
  }

  function cambiarJugador() {
    localStorage.removeItem(STORAGE_KEY);
    setMiId(null);
    setMiNombre("");
    setSeleccion("");
    setFase("identidad");
  }

  if (cargando)
    return (
      <div className="contenedor" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(15,157,88,0.12)", borderTopColor: "var(--acento)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p className="subtitulo" style={{ margin: 0 }}>Cargando...</p>
        </div>
      </div>
    );

  if (fase === "identidad" || !miId) {
    const visibles = jugadores.filter((j) =>
      j.nombre.toLowerCase().includes(filtro.toLowerCase())
    );
    return (
      <div className="contenedor">
        <div className="marca animar-entrada">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1 className="animar-entrada animar-retraso-1">Votación</h1>
        <p className="subtitulo animar-entrada animar-retraso-1">
          Elige quién eres para votar a tus compañeros de turno. Tus votos son anónimos para los demás.
        </p>

        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2 style={{ marginBottom: 14 }}>¿Quién eres?</h2>
          {jugadores.length === 0 ? (
            <p className="subtitulo" style={{ margin: 0 }}>Aún no hay jugadores dados de alta.</p>
          ) : (
            <>
              <input
                className="campo-input"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar tu nombre..."
                style={{ marginBottom: 12 }}
              />
              <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                {visibles.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setSeleccion(j.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "var(--radio-sm)",
                      border: seleccion === j.id ? "1px solid var(--acento)" : "1px solid var(--cristal-borde)",
                      background: seleccion === j.id ? "var(--acento-suave)" : "transparent",
                      color: seleccion === j.id ? "var(--acento)" : "var(--texto)",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {j.nombre}
                      <span className={`chip chip-${j.posicion}`}>{j.posicion}</span>
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--texto-suave)", fontWeight: 500 }}>
                      {j.turnoNombre}
                    </span>
                  </button>
                ))}
                {visibles.length === 0 && (
                  <p className="subtitulo" style={{ margin: 0, textAlign: "center", padding: 12 }}>
                    Sin coincidencias.
                  </p>
                )}
              </div>
              <button onClick={empezar} disabled={!seleccion}>
                {seleccion ? "Empezar a votar →" : "Selecciona tu nombre"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <FlujoVotacion votanteId={miId} votanteNombreInicial={miNombre} onCambiar={cambiarJugador} />;
}

// ── Flujo de votación (mismo formato que /votar/[token]) ──

function FlujoVotacion({
  votanteId,
  votanteNombreInicial,
  onCambiar,
}: {
  votanteId: string;
  votanteNombreInicial: string;
  onCambiar: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [votanteNombre, setVotanteNombre] = useState(votanteNombreInicial);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState<Record<string, Atributos>>({});
  const [posVotadas, setPosVotadas] = useState<Record<string, Posicion>>({});
  const [enviando, setEnviando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [confirmado, setConfirmado] = useState(false);
  const [toggleConf, setToggleConf] = useState(false);

  useEffect(() => {
    fetch(`/api/votar?id=${votanteId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setVotanteNombre(data.votante.nombre);
          setConfirmado(data.votante.confirmado);
          setObjetivos(data.objetivos);
          const iniciales: Record<string, Atributos> = {};
          const posIniciales: Record<string, Posicion> = {};
          data.objetivos.forEach((o: Objetivo) => {
            iniciales[o.id] = { ritmo: 5, resistencia: 5, tecnica: 5, remate: 5, defensa: 5 };
            posIniciales[o.id] = (o.posicion as Posicion) || "MC";
          });
          setValores(iniciales);
          setPosVotadas(posIniciales);
        }
        setCargando(false);
      });
  }, [votanteId]);

  if (cargando)
    return (
      <div className="contenedor" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(15,157,88,0.12)", borderTopColor: "var(--acento)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p className="subtitulo" style={{ margin: 0 }}>Cargando...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="contenedor">
        <div className="marca"><span className="punto" />Fútbol Viernes</div>
        <h1>Error</h1>
        <p className="subtitulo">{error}</p>
        <button className="boton-secundario" onClick={onCambiar}>Cambiar jugador</button>
      </div>
    );

  if (objetivos.length === 0)
    return (
      <div className="contenedor">
        <div className="marca"><span className="punto" />Fútbol Viernes</div>
        <h1>Hola, {votanteNombre}</h1>
        <p className="subtitulo">No hay nadie a quien votar todavía. Vuelve más tarde.</p>
        <button className="boton-secundario" onClick={onCambiar}>No soy {votanteNombre}</button>
      </div>
    );

  const actual = objetivos[indice];
  const esUltimo = indice === objetivos.length - 1;

  function actualizarValor(key: keyof Atributos, value: number) {
    setValores((prev) => ({ ...prev, [actual.id]: { ...prev[actual.id], [key]: value } }));
  }

  function ir(d: 1 | -1) {
    setDireccion(d);
    setIndice((i) => Math.max(0, Math.min(objetivos.length - 1, i + d)));
  }

  async function toggleAsistencia() {
    setToggleConf(true);
    const nuevoValor = !confirmado;
    await fetch(`/api/votar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votanteId, confirmado: nuevoValor }),
    });
    setConfirmado(nuevoValor);
    setToggleConf(false);
  }

  async function siguiente() {
    if (esUltimo) {
      setEnviando(true);
      const votos = objetivos.map((o) => ({
        objetivoId: o.id,
        ...valores[o.id],
        posicionVotada: posVotadas[o.id] ?? "MC",
      }));
      await fetch(`/api/votar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votanteId, votos }),
      });
      setEnviando(false);
      setTerminado(true);
    } else {
      ir(1);
    }
  }

  if (terminado) {
    return (
      <div className="contenedor" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--verde-niebla)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "checkPop 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.4) both" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--acento)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="marca" style={{ justifyContent: "center" }}><span className="punto" />Fútbol Viernes</div>
        <h1 style={{ marginBottom: 10 }}>¡Listo, {votanteNombre}!</h1>
        <p className="subtitulo" style={{ maxWidth: 360 }}>Tu votación se ha guardado. Gracias por participar.</p>
        <button className="boton-secundario" onClick={onCambiar} style={{ maxWidth: 240 }}>Votar como otra persona</button>
      </div>
    );
  }

  return (
    <div className="contenedor">
      <div className="marca"><span className="punto" />Fútbol Viernes</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>Hola, {votanteNombre}</h1>
        <button onClick={onCambiar} className="copiar-btn" style={{ fontSize: "0.72rem" }}>No soy yo</button>
      </div>
      <p className="subtitulo">
        Puntúa a <strong style={{ color: "var(--acento)" }}>{actual.nombre}</strong> del 1 al 10 en cada atributo. Tus votos son anónimos para los demás.
      </p>

      <button
        onClick={toggleAsistencia}
        disabled={toggleConf}
        style={{
          width: "100%",
          padding: "12px 18px",
          borderRadius: "var(--radio-md)",
          border: confirmado ? "1.5px solid var(--acento)" : "1.5px solid var(--cristal-borde)",
          background: confirmado ? "var(--verde-niebla)" : "var(--cristal-bg)",
          color: confirmado ? "var(--acento)" : "var(--texto)",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: 16,
          transition: "all 0.2s ease",
        }}
      >
        {toggleConf ? "..." : confirmado ? "✓ Confirmado — voy a jugar esta semana" : "Confirmar que voy a jugar esta semana"}
      </button>

      <div className="tarjeta" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <AnilloProgreso valor={indice + 1} max={objetivos.length} size={54} etiqueta="jugador" />
        <span className="subtitulo" style={{ margin: 0 }}>{indice + 1} de {objetivos.length} jugadores</span>
      </div>

      <div key={actual.id} style={{ animation: `deslizar-${direccion} 0.35s ease-out both` }}>
        <div className="tarjeta">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {actual.nombre}
            <span className={`chip chip-${actual.posicion}`}>{actual.posicion}</span>
          </h2>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--texto-suave)", marginBottom: 8 }}>
              ¿En qué posición le pondrías?
            </label>
            <select
              className="campo-select"
              value={posVotadas[actual.id] ?? "MC"}
              onChange={(e) => setPosVotadas((prev) => ({ ...prev, [actual.id]: e.target.value as Posicion }))}
            >
              {POSICIONES.map((p) => (<option key={p} value={p}>{p} — {POSICION_LABELS[p]}</option>))}
            </select>
          </div>

          {ATRIBUTOS_INFO.map(({ key, label }) => (
            <div className="fila-atributo" key={key}>
              <label>{label}</label>
              <input type="range" min={1} max={10} value={valores[actual.id]?.[key] ?? 5} onChange={(e) => actualizarValor(key, Number(e.target.value))} />
              <span className="valor-atributo">{valores[actual.id]?.[key] ?? 5}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {indice > 0 && (
          <button onClick={() => ir(-1)} disabled={enviando} style={{ width: "auto", flex: "0 0 auto", padding: "13px 18px" }}>←</button>
        )}
        <button onClick={siguiente} disabled={enviando}>
          {enviando ? "Guardando..." : esUltimo ? "Terminar y enviar" : "Siguiente jugador →"}
        </button>
      </div>
    </div>
  );
}
