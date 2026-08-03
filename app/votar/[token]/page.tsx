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
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState<Record<string, Atributos>>({});
  const [enviando, setEnviando] = useState(false);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    fetch(`/api/votar/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setVotanteNombre(data.votante.nombre);
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
      <div className="contenedor">
        <p className="subtitulo">Cargando...</p>
      </div>
    );
  if (error)
    return (
      <div className="contenedor">
        <p className="subtitulo">{error}</p>
      </div>
    );
  if (objetivos.length === 0)
    return (
      <div className="contenedor">
        <p className="subtitulo">No hay nadie a quien votar todavía.</p>
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
      setIndice((i) => i + 1);
    }
  }

  if (terminado) {
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Gracias, {votanteNombre}</h1>
        <p className="subtitulo">Tu votación se ha guardado correctamente.</p>
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

      <div
        className="tarjeta"
        key={actual.id}
        style={{ animation: "entrar 0.3s ease-out" }}
      >
        <div
          className="tarjeta"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        ></div>
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

      <div className="tarjeta">
        <h2>
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

      <button onClick={siguiente} disabled={enviando}>
        {enviando
          ? "Guardando..."
          : esUltimo
            ? "Terminar y enviar"
            : "Siguiente jugador →"}
      </button>
    </div>
  );
}
