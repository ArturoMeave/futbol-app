import Link from "next/link";

export default function Home() {
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

      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2>Panel de admin</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Gestiona jugadores y consigue los links de votación de cada uno.
        </p>
        <Link href="/admin">
          <button>Ir al panel de admin</button>
        </Link>
      </div>

      <div className="tarjeta animar-entrada animar-retraso-3">
        <h2>Generar equipos</h2>
        <p className="subtitulo" style={{ marginBottom: 20 }}>
          Reparte a los jugadores en dos equipos equilibrados al instante.
        </p>
        <Link href="/equipos?turno=1">
          <button>Ver equipos — Turno 1 (20:00)</button>
        </Link>
        <div style={{ height: 12 }} />
        <Link href="/equipos?turno=2">
          <button className="boton-secundario">
            Ver equipos — Turno 2 (21:00)
          </button>
        </Link>
      </div>
    </div>
  );
}
