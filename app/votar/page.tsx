"use client";

import { useEffect, useState } from "react";
import { Posicion } from "@/lib/db";
import FormularioVotacion from "@/lib/FormularioVotacion";

interface JugadorLista {
  id: string;
  nombre: string;
  posicion: Posicion;
  turnoId: string;
  turnoNombre: string;
}

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
          const found = (data.jugadores || []).find(
            (j: JugadorLista) => j.id === guardado,
          );
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
              border: "3px solid rgba(15,157,88,0.12)",
              borderTopColor: "var(--acento)",
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

  if (fase === "identidad" || !miId) {
    const visibles = jugadores.filter((j) =>
      j.nombre.toLowerCase().includes(filtro.toLowerCase()),
    );
    return (
      <div className="contenedor">
        <div className="marca animar-entrada">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1 className="animar-entrada animar-retraso-1">Votación</h1>
        <p className="subtitulo animar-entrada animar-retraso-1">
          Elige quién eres para votar a tus compañeros de turno. Tus votos son
          anónimos para los demás.
        </p>

        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2 style={{ marginBottom: 14 }}>¿Quién eres?</h2>
          {jugadores.length === 0 ? (
            <p className="subtitulo" style={{ margin: 0 }}>
              Aún no hay jugadores dados de alta.
            </p>
          ) : (
            <>
              <input
                className="campo-input"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar tu nombre..."
                style={{ marginBottom: 12 }}
              />
              <div
                style={{
                  maxHeight: 360,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginBottom: 16,
                }}
              >
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
                      border:
                        seleccion === j.id
                          ? "1px solid var(--acento)"
                          : "1px solid var(--cristal-borde)",
                      background:
                        seleccion === j.id
                          ? "var(--acento-suave)"
                          : "transparent",
                      color:
                        seleccion === j.id ? "var(--acento)" : "var(--texto)",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {j.nombre}
                      <span className={`chip chip-${j.posicion}`}>
                        {j.posicion}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--texto-suave)",
                        fontWeight: 500,
                      }}
                    >
                      {j.turnoNombre}
                    </span>
                  </button>
                ))}
                {visibles.length === 0 && (
                  <p
                    className="subtitulo"
                    style={{ margin: 0, textAlign: "center", padding: 12 }}
                  >
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

  // ¡Fíjate qué limpio queda esto ahora!
  return (
    <FormularioVotacion 
      votanteId={miId} 
      votanteNombreInicial={miNombre} 
      onCambiar={cambiarJugador} 
    />
  );
}
