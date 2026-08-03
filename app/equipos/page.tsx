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
}

interface Resultado {
  equipoA: JugadorConNota[];
  equipoB: JugadorConNota[];
  totalA: number;
  totalB: number;
  diferencia: number;
  error?: string;
}

function EquiposContenido() {
  const params = useSearchParams();
  const turno = params.get("turno") === "2" ? "2" : "1";

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(true);

  async function generar() {
    setCargando(true);
    const r = await fetch(`/api/equipos?turno=${turno}`);
    const data = await r.json();
    setResultado(data);
    setCargando(false);
  }

  useEffect(() => {
    generar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turno]);

  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1>Equipos — Turno {turno}</h1>
      <p className="subtitulo">
        Generados a partir de la puntuación cruzada del grupo
      </p>

      {cargando && <p className="subtitulo">Calculando equipos...</p>}
      {resultado?.error && <p className="subtitulo">{resultado.error}</p>}

      {resultado && !resultado.error && (
        <>
          <div className="tarjeta" style={{ textAlign: "center" }}>
            <span className="subtitulo" style={{ marginBottom: 0 }}>
              Diferencia entre equipos:{" "}
              <strong style={{ color: "var(--verde-texto)" }}>
                {resultado.diferencia}
              </strong>{" "}
              pts
            </span>
          </div>

          <div className="equipos-grid">
            <div className="tarjeta">
              <div className="total-equipo">Equipo A — {resultado.totalA}</div>
              {resultado.equipoA.map((j) => (
                <div className="jugador-fila" key={j.id}>
                  <span>
                    {j.nombre}
                    <span className={`chip chip-${j.posicion}`}>
                      {j.posicion}
                    </span>
                  </span>
                  <AnilloProgreso valor={j.notaPosicion} size={44} grosor={4} />
                </div>
              ))}
            </div>

            <div className="tarjeta">
              <div className="total-equipo">Equipo B — {resultado.totalB}</div>
              {resultado.equipoB.map((j) => (
                <div className="jugador-fila" key={j.id}>
                  <span>
                    {j.nombre}
                    <span className={`chip chip-${j.posicion}`}>
                      {j.posicion}
                    </span>
                  </span>
                  <AnilloProgreso valor={j.notaPosicion} size={44} grosor={4} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={generar}>Regenerar equipos</button>
        </>
      )}
    </div>
  );
}

export default function EquiposPage() {
  return (
    <Suspense
      fallback={
        <div className="contenedor">
          <p className="subtitulo">Cargando...</p>
        </div>
      }
    >
      <EquiposContenido />
    </Suspense>
  );
}
