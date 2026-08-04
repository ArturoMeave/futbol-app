"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnilloProgreso from "@/lib/AnilloProgreso";

interface TurnoOpt {
  id: string;
  nombre: string;
  activo: boolean;
}

interface JugadorEstado {
  id: string;
  nombre: string;
  confirmado: boolean;
  votosHechos: number;
  totalPosibles: number;
}

export default function Home() {
  const [turnos, setTurnos] = useState<TurnoOpt[]>([]);
  const [jugadores, setJugadores] = useState<JugadorEstado[]>([]);
  const [miToken, setMiToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/turnos")
      .then((r) => r.json())
      .then((data) => setTurnos(data || []));
    fetch("/api/jugadores")
      .then((r) => r.json())
      .then((data) => setJugadores(data || []));
    const t = localStorage.getItem("futbol-token");
    if (t) setMiToken(t);
  }, []);

  const turnosActivos = turnos.filter((t) => t.activo !== false);

  const confirmados = jugadores.filter((j) => j.confirmado).length;
  const progresoVotacion =
    jugadores.length === 0
      ? 0
      : Math.round(
          (jugadores.reduce(
            (acc, j) => acc + j.votosHechos / Math.max(1, j.totalPosibles),
            0
          ) /
            jugadores.length) *
            100
        );

  return (
    <div className="contenedor">
      <div className="marca animar-entrada">
        <span className="punto" />
        Fútbol Viernes
      </div>

      <h1 className="animar-entrada animar-retraso-1">
        Equipos equilibrados,
        <br />
        sin discusiones
      </h1>
      <p className="subtitulo animar-entrada animar-retraso-1">
        Cada jugador puntúa al resto de forma anónima. Con esos datos, el
        reparto sale solo — ni favoritismos, ni equipos cojos.
      </p>

      {/* Stats dashboard */}
      {jugadores.length > 0 && (
        <div className="stat-grid animar-entrada animar-retraso-2">
          <div className="stat-card principal">
            <div>
              <div className="stat-etiqueta">Votación global</div>
              <div className="stat-sub">
                {jugadores.length} jugadores en la plantilla
              </div>
            </div>
            <AnilloProgreso
              valor={progresoVotacion}
              max={100}
              size={72}
              grosor={6}
              etiqueta="%"
            />
          </div>
          <div className="stat-card">
            <div className="stat-etiqueta">Plantilla</div>
            <div className="stat-numero">{jugadores.length}</div>
            <div className="stat-sub">jugadores</div>
          </div>
          <div className="stat-card">
            <div className="stat-etiqueta">Confirmados</div>
            <div className="stat-numero">{confirmados}</div>
            <div className="stat-sub">esta semana</div>
          </div>
        </div>
      )}

      {/* Recordar mi link */}
      {miToken && (
        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2>Continuar</h2>
          <p className="subtitulo" style={{ marginBottom: 20 }}>
            Ya tienes una sesión abierta. Entra directo a tu votación.
          </p>
          <Link href={`/votar/${miToken}`}>
            <button>Mi votación →</button>
          </Link>
        </div>
      )}

      {/* Apuntarse */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2>Votar a los compañeros</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Un solo link para todos. Elige tu nombre y puntúa al resto.
        </p>
        <Link href="/votar">
          <button>Ir a votar →</button>
        </Link>
      </div>

      {/* Primera vez */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2>¿Primera vez?</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Apúntate con tu nombre y posición. Después podrás votar y confirmar si
          vienes cada semana.
        </p>
        <Link href="/unirse">
          <button className="boton-secundario">Apuntarme</button>
        </Link>
      </div>

      {/* Equipos */}
      {turnosActivos.length > 0 && (
        <div className="tarjeta animar-entrada animar-retraso-3">
          <h2>Ver equipos</h2>
          <p className="subtitulo" style={{ marginBottom: 20 }}>
            Reparte a los jugadores confirmados en dos equipos equilibrados.
          </p>
          {turnosActivos.map((t, i) => (
            <div key={t.id} style={{ marginBottom: i < turnosActivos.length - 1 ? 12 : 0 }}>
              <Link href={`/equipos?turno=${t.id}`}>
                <button className={i === 0 ? "" : "boton-secundario"}>
                  {t.nombre}
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}