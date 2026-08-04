"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SelectPosicion from "@/lib/SelectPosicion";
import { Posicion } from "@/lib/db";

interface Inscrito {
  id: string;
  nombre: string;
  posicion: string;
  turnoNombre: string;
}

interface TurnoOpt {
  id: string;
  nombre: string;
}

export default function UnirsePage() {
  const router = useRouter();
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [turnos, setTurnos] = useState<TurnoOpt[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState<Posicion>("MC");
  const [turno, setTurno] = useState("");
  const [palabra, setPalabra] = useState("");

  const [linkPegado, setLinkPegado] = useState("");
  const [errorLink, setErrorLink] = useState("");

  function usarLink() {
    setErrorLink("");
    const txt = linkPegado.trim();
    if (!txt) {
      setErrorLink("Pega tu link de votación.");
      return;
    }
    const match = txt.match(/\/votar\/([A-Za-z0-9-]+)/);
    if (!match) {
      setErrorLink("Link no válido. Debe acabar en /votar/TOKEN");
      return;
    }
    const token = match[1];
    localStorage.setItem("futbol-token", token);
    router.push(`/votar/${token}`);
  }

  useEffect(() => {
    fetch("/api/unirse")
      .then((r) => r.json())
      .then((data) => {
        setInscritos(data.inscritos || []);
        setTurnos(data.turnos || []);
        if (data.turnos?.length > 0) setTurno(data.turnos[0].id);
        setCargando(false);
      });
  }, []);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("Pon tu nombre");
      return;
    }
    setEnviando(true);
    const r = await fetch("/api/unirse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, posicion, turno, palabraAcceso: palabra }),
    });
    const data = await r.json();
    setEnviando(false);

    if (r.ok) {
      // Guardar token en localStorage para recordar el link
      localStorage.setItem("futbol-token", data.token);
      router.push(`/votar/${data.token}`);
    } else {
      setError(data.error || "Error al registrar");
    }
  }

  if (cargando)
    return (
      <div className="contenedor">
        <div className="marca animar-entrada">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1 className="animar-entrada animar-retraso-1">Apuntarse</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(26, 122, 76, 0.12)",
              borderTopColor: "var(--verde-primario)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      </div>
    );

  return (
    <div className="contenedor">
      <div className="marca animar-entrada">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1 className="animar-entrada animar-retraso-1">Apuntarse</h1>
      <p className="subtitulo animar-entrada animar-retraso-1">
        Regístrate una sola vez. Después podrás votar a tus compañeros y confirmar
        si vas a jugar esta semana.
      </p>

      {/* Quién ya está apuntado */}
      {inscritos.length > 0 && (
        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2>Ya apuntados ({inscritos.length})</h2>
          <div style={{ marginTop: 10 }}>
            {inscritos.map((i) => (
              <div className="jugador-fila" key={i.id}>
                <span>
                  {i.nombre}
                  <span className={`chip chip-${i.posicion}`}>{i.posicion}</span>
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--texto-suave)",
                    textAlign: "right",
                  }}
                >
                  {i.turnoNombre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pega tu link */}
      <div className="tarjeta animar-entrada animar-retraso-2">
        <h2>Tengo mi link</h2>
        <p className="subtitulo" style={{ marginBottom: 12, fontSize: "0.9rem" }}>
          Si el admin te pasó un link de votación, pégalo aquí para entrar directamente.
        </p>
        {errorLink && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.85rem",
              margin: "8px 0",
              background: "rgba(220, 38, 38, 0.08)",
              padding: "10px 14px",
              borderRadius: "var(--radio-sm)",
            }}
          >
            {errorLink}
          </p>
        )}
        <input
          className="campo-input"
          value={linkPegado}
          onChange={(e) => setLinkPegado(e.target.value)}
          placeholder="https://futbol.../votar/tok-..."
        />
        <button onClick={usarLink} style={{ marginTop: 12 }}>
          Entrar a mi votación →
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={registrar} className="tarjeta animar-entrada animar-retraso-2">
        <h2>Tus datos</h2>
        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.88rem",
              margin: "10px 0",
              background: "rgba(220, 38, 38, 0.08)",
              padding: "10px 14px",
              borderRadius: "var(--radio-sm)",
            }}
          >
            {error}
          </p>
        )}

        <div className="fila-atributo" style={{ marginBottom: 12 }}>
          <label>Nombre</label>
          <input
            className="campo-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Como te conocen en el grupo"
            maxLength={30}
          />
        </div>

        <div className="fila-atributo" style={{ marginBottom: 12 }}>
          <label>Posición</label>
          <SelectPosicion value={posicion} onChange={setPosicion} />
        </div>

        <div className="fila-atributo" style={{ marginBottom: 12 }}>
          <label>Turno</label>
          <select
            className="campo-select"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="fila-atributo" style={{ marginBottom: 20 }}>
          <label>Palabra</label>
          <input
            className="campo-input"
            value={palabra}
            onChange={(e) => setPalabra(e.target.value)}
            placeholder="La palabra del grupo"
            type="password"
          />
        </div>

        <button type="submit" disabled={enviando}>
          {enviando ? "Apuntando..." : "Apuntarme y votar →"}
        </button>
      </form>
    </div>
  );
}