import Link from "next/link";
import AnilloProgreso from "@/lib/AnilloProgreso";

export default function Home() {
  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>

      <h1>Equipos equilibrados, sin discusiones</h1>
      <p className="subtitulo">
        Cada jugador puntúa al resto de forma anónima. Con esos datos, el
        reparto sale solo — ni favoritismos, ni equipos cojos.
      </p>

      <div
        className="tarjeta"
        style={{ display: "flex", alignItems: "center", gap: 18 }}
      >
        <AnilloProgreso valor={8.4} etiqueta="media" size={64} />
        <div>
          <h2>Panel de admin</h2>
          <p className="subtitulo" style={{ marginBottom: 14 }}>
            Añade jugadores y consigue el link de votación de cada uno.
          </p>
          <Link href="/admin">
            <button>Ir al panel de admin</button>
          </Link>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Generar equipos</h2>
        <p className="subtitulo" style={{ marginBottom: 16 }}>
          Reparte a los jugadores de un turno en dos equipos equilibrados.
        </p>
        <Link href="/equipos?turno=1">
          <button>Ver equipos — Turno 1 (20:00)</button>
        </Link>
        <div style={{ height: 10 }} />
        <Link href="/equipos?turno=2">
          <button
            className="boton-secundario"
            style={{ background: "transparent" }}
          >
            Ver equipos — Turno 2 (21:00)
          </button>
        </Link>
      </div>
    </div>
  );
}
