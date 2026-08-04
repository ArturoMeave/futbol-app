"use client";

import { useEffect, useState } from "react";
import AnilloProgreso from "@/lib/AnilloProgreso";

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

export default function VotarPage({ params }: { params: { token: string } }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [votanteNombre, setVotanteNombre] = useState("");
  const [turnoNombre, setTurnoNombre] = useState("");
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState<Record<string, Atributos>>({});
  const [enviando, setEnviando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [confirmado, setConfirmado] = useState(false);
  const [toggleConf, setToggleConf] = useState(false);

  useEffect(() => {
    // Guardar token en localStorage para recordar el link
    localStorage.setItem("futbol-token", params.token);
    fetch(`/api/votar/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setVotanteNombre(data.votante.nombre);
          setConfirmado(data.votante.confirmado);
          setTurnoNombre(data.turnoNombre);
          setObjetivos(data.objetivos);
          const iniciales: Record<string, Atributos> = {};
          data.objetivos.forEach((o: Objetivo) => {
            iniciales[o.id] = {
              ritmo: 5,
              resistencia: 5,
              tecnica: 5,
              remate: 5,
              defensa: 5,
            };
          });
          setValores(iniciales);
        }
        setCargando(false);
      });
  }, [params.token]);

  if (cargando)
    return (
      <div
        className="contenedor"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
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
            Cargando...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Link no válido</h1>
        <p className="subtitulo">{error}</p>
      </div>
    );

  if (objetivos.length === 0)
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Hola, {votanteNombre}</h1>
        <p className="subtitulo">
          No hay nadie a quien votar todavía. Vuelve más tarde.
        </p>
      </div>
    );

  const actual = objetivos[indice];
  const esUltimo = indice === objetivos.length - 1;

  function actualizarValor(key: keyof Atributos, value: number) {
    setValores((prev) => ({
      ...prev,
      [actual.id]: { ...prev[actual.id], [key]: value },
    }));
  }

  function ir(d: 1 | -1) {
    setDireccion(d);
    setIndice((i) => Math.max(0, Math.min(objetivos.length - 1, i + d)));
  }

  async function toggleAsistencia() {
    setToggleConf(true);
    const nuevoValor = !confirmado;
    await fetch(`/api/votar/${params.token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmado: nuevoValor }),
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
      }));
      await fetch(`/api/votar/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votos }),
      });
      setEnviando(false);
      setTerminado(true);
    } else {
      ir(1);
    }
  }

  if (terminado) {
    return (
      <div
        className="contenedor"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: "var(--verde-niebla)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            animation: "checkPop 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.4) both",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--verde-primario)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="marca" style={{ justifyContent: "center" }}>
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1 style={{ marginBottom: 10 }}>¡Listo, {votanteNombre}!</h1>
        <p className="subtitulo" style={{ maxWidth: 360 }}>
          Tu votación se ha guardado correctamente. Gracias por participar.
        </p>
      </div>
    );
  }

  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1>Hola, {votanteNombre}</h1>
      <p className="subtitulo">
        Puntúa a{" "}
        <strong style={{ color: "var(--verde-texto)" }}>{actual.nombre}</strong>{" "}
        del 1 al 10 en cada atributo. Tus votos son anónimos para los demás.
      </p>

      {/* Confirmar asistencia */}
      <button
        onClick={toggleAsistencia}
        disabled={toggleConf}
        style={{
          width: "100%",
          padding: "12px 18px",
          borderRadius: "var(--radio-md)",
          border: confirmado
            ? "1.5px solid var(--verde-primario)"
            : "1.5px solid var(--cristal-borde)",
          background: confirmado ? "var(--verde-niebla)" : "var(--cristal-bg)",
          color: confirmado ? "var(--verde-primario)" : "var(--texto)",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          marginBottom: 16,
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {toggleConf
          ? "..."
          : confirmado
            ? "✓ Confirmado — voy a jugar esta semana"
            : "Confirmar que voy a jugar esta semana"}
      </button>

      <div
        className="tarjeta"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <AnilloProgreso
          valor={indice + 1}
          max={objetivos.length}
          size={54}
          etiqueta="jugador"
        />
        <span className="subtitulo" style={{ margin: 0 }}>
          {indice + 1} de {objetivos.length} jugadores
        </span>
      </div>

      <div
        key={actual.id}
        style={{ animation: `deslizar-${direccion} 0.35s ease-out both` }}
      >
        <div className="tarjeta">
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {actual.nombre}
            <span className={`chip chip-${actual.posicion}`}>
              {actual.posicion}
            </span>
          </h2>

          {ATRIBUTOS_INFO.map(({ key, label }) => (
            <div className="fila-atributo" key={key}>
              <label>{label}</label>
              <input
                type="range"
                min={1}
                max={10}
                value={valores[actual.id]?.[key] ?? 5}
                onChange={(e) => actualizarValor(key, Number(e.target.value))}
              />
              <span className="valor-atributo">
                {valores[actual.id]?.[key] ?? 5}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {indice > 0 && (
          <button
            onClick={() => ir(-1)}
            disabled={enviando}
            style={{ width: "auto", flex: "0 0 auto", padding: "13px 18px" }}
          >
            ←
          </button>
        )}
        <button onClick={siguiente} disabled={enviando}>
          {enviando
            ? "Guardando..."
            : esUltimo
              ? "Terminar y enviar"
              : "Siguiente jugador →"}
        </button>
      </div>
    </div>
  );
}