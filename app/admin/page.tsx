"use client";

import { useEffect, useState } from "react";

interface Jugador {
  id: string;
  nombre: string;
  posicion: "POR" | "DEF" | "MED" | "DEL";
  turno: 1 | 2;
  token: string;
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState<Jugador["posicion"]>("MED");
  const [turno, setTurno] = useState<1 | 2>(1);
  const [origen, setOrigen] = useState("");

  function cargar() {
    fetch("/api/jugadores")
      .then((r) => r.json())
      .then(setJugadores);
  }

  useEffect(() => {
    const secreto = process.env.NEXT_PUBLIC_ADMIN_SECRET;
    if (!secreto) {
      // Sin secreto configurado: dejamos entrar (modo dev local)
      setAutenticado(true);
      return;
    }
    if (sessionStorage.getItem("admin-ok") === "1") {
      setAutenticado(true);
      return;
    }
    const intento = prompt("Contraseña de admin:");
    if (intento === secreto) {
      sessionStorage.setItem("admin-ok", "1");
      setAutenticado(true);
    } else {
      alert("Contraseña incorrecta");
    }
  }, []);

  useEffect(() => {
    if (!autenticado) return;
    cargar();
    setOrigen(window.location.origin);
  }, [autenticado]);

  if (!autenticado) {
    return (
      <div className="contenedor">
        <p className="subtitulo">Acceso restringido.</p>
      </div>
    );
  }

  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  async function adminFetch(url: string, opts: RequestInit = {}) {
    return fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "x-admin-secret": adminSecret || "",
      },
    });
  }

  async function agregar() {
    if (!nombre.trim()) return;
    await adminFetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, posicion, turno }),
    });
    setNombre("");
    cargar();
  }

  function copiar(link: string) {
    navigator.clipboard.writeText(link);
    alert("Link copiado ");
  }

  async function resetVotos() {
    if (!confirm("¿Borrar TODOS los votos? Esto inicia una nueva semana.")) return;
    await adminFetch("/api/reset", { method: "POST" });
    alert("Votos borrados. Nueva semana.");
  }

  async function borrarJugador(id: string) {
    if (!confirm("¿Borrar este jugador y todos sus votos?")) return;
    await adminFetch(`/api/jugadores?id=${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <div className="contenedor">
      <div className="marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1>Panel de admin</h1>
      <p className="subtitulo">
        Añade jugadores y copia su link de votación para mandarlo por WhatsApp
      </p>

      <button
        onClick={resetVotos}
        style={{
          background: "transparent",
          color: "#c1503f",
          border: "1.5px solid #c1503f",
          marginBottom: 22,
        }}
      >
        🗑️ Borrar todos los votos (nueva semana)
      </button>

      <div className="tarjeta">
        <div className="fila-atributo">
          <label>Nombre</label>
          <input
            className="campo-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del jugador"
          />
        </div>
        <div className="fila-atributo">
          <label>Posición</label>
          <select
            className="campo-select"
            value={posicion}
            onChange={(e) => setPosicion(e.target.value as Jugador["posicion"])}
          >
            <option value="POR">Portero</option>
            <option value="DEF">Defensa</option>
            <option value="MED">Medio</option>
            <option value="DEL">Delantero</option>
          </select>
        </div>
        <div className="fila-atributo">
          <label>Turno</label>
          <select
            className="campo-select"
            value={turno}
            onChange={(e) => setTurno(Number(e.target.value) as 1 | 2)}
          >
            <option value={1}>Turno 1 (20:00)</option>
            <option value={2}>Turno 2 (21:00)</option>
          </select>
        </div>
        <button onClick={agregar}>Añadir jugador</button>
      </div>

      <h2>Turno 1</h2>
      <div className="tarjeta">
        {jugadores
          .filter((j) => j.turno === 1)
          .map((j) => (
            <div className="link-jugador" key={j.id}>
              <span>
                {j.nombre}{" "}
                <span className={`chip chip-${j.posicion}`}>{j.posicion}</span>
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button
                  className="copiar-btn"
                  onClick={() => copiar(`${origen}/votar/${j.token}`)}
                >
                  Copiar link
                </button>
                <button
                  className="copiar-btn"
                  style={{ background: "#c1503f" }}
                  onClick={() => borrarJugador(j.id)}
                >
                  Borrar
                </button>
              </span>
            </div>
          ))}
      </div>

      <h2>Turno 2</h2>
      <div className="tarjeta">
        {jugadores
          .filter((j) => j.turno === 2)
          .map((j) => (
            <div className="link-jugador" key={j.id}>
              <span>
                {j.nombre}{" "}
                <span className={`chip chip-${j.posicion}`}>{j.posicion}</span>
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button
                  className="copiar-btn"
                  onClick={() => copiar(`${origen}/votar/${j.token}`)}
                >
                  Copiar link
                </button>
                <button
                  className="copiar-btn"
                  style={{ background: "#c1503f" }}
                  onClick={() => borrarJugador(j.id)}
                >
                  Borrar
                </button>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
