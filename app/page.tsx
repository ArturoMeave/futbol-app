"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TurnoOpt {
  id: string;
  nombre: string;
  activo: boolean;
}

export default function Home() {
  const [turnos, setTurnos] = useState<TurnoOpt[]>([]);
  const [miToken, setMiToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/turnos")
      .then((r) => r.json())
      .then((data) => setTurnos(data || []));
    const t = localStorage.getItem("futbol-token");
    if (t) setMiToken(t);
  }, []);

  const turnosActivos = turnos.filter((t) => t.activo !== false);

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
        <h2>¿Primera vez?</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Apúntate con tu nombre y posición. Después podrás votar y confirmar si
          vienes cada semana.
        </p>
        <Link href="/unirse">
          <button>Apuntarme y votar</button>
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

      {/* Admin */}
      <div className="tarjeta animar-entrada animar-retraso-3">
        <h2>Admin</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Gestiona turnos, jugadores e inicia semana nueva.
        </p>
        <Link href="/admin">
          <button className="boton-secundario">Panel de admin</button>
        </Link>
      </div>
    </div>
  );
}