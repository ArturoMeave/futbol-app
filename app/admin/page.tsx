"use client";

import { useEffect, useState } from "react";
import SelectPosicion from "@/lib/SelectPosicion";
import { Posicion } from "@/lib/constantes";

interface Jugador {
  id: string;
  nombre: string;
  posicion: Posicion;
  turno: string;
  token: string;
  confirmado: boolean;
  votosHechos: number;
  totalPosibles: number;
}

interface Turno {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

interface JugadorStats {
  id: string;
  nombre: string;
  posicion: string;
  numVotos: number;
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
  notaGlobal: number;
}

interface HistorialItem {
  id: number;
  turnoId: string;
  turnoNombre: string;
  fecha: number;
  totalA: number;
  totalB: number;
  diferencia: number;
  equipoA: {
    id: string;
    nombre: string;
    posicion: string;
    notaPosicion: number;
  }[];
  equipoB: {
    id: string;
    nombre: string;
    posicion: string;
    notaPosicion: number;
  }[];
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reseteando, setReseteando] = useState(false);
  const [origen, setOrigen] = useState("");

  // Fichar (sin turno)
  const [fichaNombre, setFichaNombre] = useState("");
  const [fichaPosicion, setFichaPosicion] = useState<Posicion>("MC");
  const [fichando, setFichando] = useState(false);

  // Turnos
  const [nuevoTurnoNombre, setNuevoTurnoNombre] = useState("");

  // Bulk import
  const [bulkTexto, setBulkTexto] = useState("");
  const [bulkTurno, setBulkTurno] = useState("");
  const [bulkPosicion, setBulkPosicion] = useState<Posicion>("MC");
  const [importando, setImportando] = useState(false);

  // Stats
  const [statsAbierta, setStatsAbierta] = useState<Jugador | null>(null);
  const [statsData, setStatsData] = useState<JugadorStats | null>(null);
  const [statsCargando, setStatsCargando] = useState(false);

  // Edit inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPosicion, setEditPosicion] = useState<Posicion>("MC");
  const [editTurno, setEditTurno] = useState("");

  // Historial
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [historialExpandido, setHistorialExpandido] = useState<number | null>(
    null,
  );

  // Selección múltiple
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [bulkAcciones, setBulkAcciones] = useState(false);

  useEffect(() => {
    // 1. Buscamos si ya introducimos la contraseña antes
    let tokenGuardado = sessionStorage.getItem("admin-secret");

    // 2. Si no la tenemos, se la pedimos al usuario
    if (!tokenGuardado) {
      tokenGuardado = prompt("Introduce la contraseña de administrador:");
      // 3. Si escribe algo, lo guardamos en su sesión
      if (tokenGuardado) {
        sessionStorage.setItem("admin-secret", tokenGuardado);
      }
    }

    // 4. Le dejamos ver la pantalla, pero el servidor decidirá si sus acciones funcionan
    setAutenticado(true);
  }, []);

  async function adminFetch(url: string, opts: RequestInit = {}) {
    // 5. Recuperamos la llave guardada
    const token = sessionStorage.getItem("admin-secret") || "";

    // 6. Enviamos al cartero con la llave en la mano
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "x-admin-secret": token,
      },
    });

    // 7. Si el servidor nos rechaza la llave...
    if (res.status === 401) {
      alert(
        "Contraseña incorrecta o caducada. Recarga la página para intentarlo de nuevo.",
      );
      sessionStorage.removeItem("admin-secret");
    }

    return res;
  }

  function cargar() {
    setCargando(true);
    Promise.all([
      adminFetch("/api/jugadores").then((r) => r.json()),
      adminFetch("/api/turnos").then((r) => r.json()),
    ]).then(([js, ts]: [Jugador[], Turno[]]) => {
      setJugadores(js);
      setTurnos(ts);
      if (ts.length > 0 && !bulkTurno) setBulkTurno(ts[0].id);
      setCargando(false);
    });
  }

  useEffect(() => {
    if (!autenticado) return;
    cargar();
    setOrigen(window.location.origin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  // ---- Selección ----
  function toggleSeleccion(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function seleccionarTurno(ids: string[]) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      const todosSel = ids.every((id) => next.has(id));
      if (todosSel) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function limpiarSeleccion() {
    setSeleccion(new Set());
  }

  async function bulkConfirmar(confirmado: boolean) {
    if (seleccion.size === 0) return;
    setBulkAcciones(true);
    await adminFetch("/api/jugadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(seleccion), confirmado }),
    });
    setBulkAcciones(false);
    setSeleccion(new Set());
    cargar();
  }

  async function bulkEliminar() {
    if (seleccion.size === 0) return;
    if (!confirm(`¿Eliminar ${seleccion.size} jugador(es) y todos sus votos?`))
      return;
    setBulkAcciones(true);
    await adminFetch(`/api/jugadores?ids=${Array.from(seleccion).join(",")}`, {
      method: "DELETE",
    });
    setBulkAcciones(false);
    setSeleccion(new Set());
    cargar();
  }

  if (!autenticado) {
    return (
      <div className="contenedor">
        <div className="marca">
          <span className="punto" />
          Fútbol Viernes
        </div>
        <h1>Acceso restringido</h1>
        <p className="subtitulo">
          Necesitas la contraseña de admin para entrar.
        </p>
      </div>
    );
  }

  // ---- Acciones jugador ----
  async function fichar() {
    if (!fichaNombre.trim()) return;
    setFichando(true);
    await adminFetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: fichaNombre, posicion: fichaPosicion }),
    });
    setFichaNombre("");
    setFichando(false);
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este jugador y todos sus votos?")) return;
    await adminFetch(`/api/jugadores?id=${id}`, { method: "DELETE" });
    setSeleccion((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    cargar();
  }

  async function editarJugador(j: Jugador) {
    if (!editNombre.trim() || !editPosicion || !editTurno) return;
    await adminFetch("/api/jugadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: j.id,
        nombre: editNombre.trim(),
        posicion: editPosicion,
        turno: editTurno,
      }),
    });
    setEditandoId(null);
    cargar();
  }

  function iniciarEdicion(j: Jugador) {
    setEditandoId(j.id);
    setEditNombre(j.nombre);
    setEditPosicion(j.posicion);
    setEditTurno(j.turno);
  }

  async function verStats(j: Jugador) {
    setStatsAbierta(j);
    setStatsData(null);
    setStatsCargando(true);
    const r = await adminFetch(`/api/jugadores/${j.id}/stats`);
    const data = await r.json();
    setStatsData(data);
    setStatsCargando(false);
  }

  async function bulkImport() {
    const nombres = bulkTexto
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (nombres.length === 0 || !bulkTurno) return;
    setImportando(true);
    const payload = nombres.map((n) => ({
      nombre: n,
      posicion: bulkPosicion,
      turno: bulkTurno,
    }));
    const r = await adminFetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    setImportando(false);
    if (data?.creados != null) {
      setBulkTexto("");
      alert(`${data.creados} jugador(es) añadidos.`);
      cargar();
    } else {
      alert("Error al importar.");
    }
  }

  function copiarTodosLinks() {
    if (jugadores.length === 0) {
      alert("No hay jugadores.");
      return;
    }
    const texto = jugadores
      .map((j) => `${j.nombre}: ${origen}/votar/${j.token}`)
      .join("\n");
    navigator.clipboard.writeText(texto);
    alert(`Copiados ${jugadores.length} links.`);
  }

  function copiarLinksTurno(turnoId: string) {
    const js = jugadores.filter((j) => j.turno === turnoId);
    if (js.length === 0) return;
    const texto = js
      .map((j) => `${j.nombre}: ${origen}/votar/${j.token}`)
      .join("\n");
    navigator.clipboard.writeText(texto);
    alert(`Copiados ${js.length} links de este turno.`);
  }

  function copiar(link: string) {
    navigator.clipboard.writeText(link);
    alert("Link copiado ✅");
  }

  async function nuevaSemana() {
    if (
      !confirm(
        "¿Iniciar nueva semana? Se reinician las confirmaciones. Los votos se mantienen.",
      )
    )
      return;
    setReseteando(true);
    await adminFetch("/api/reset", { method: "POST" });
    setReseteando(false);
    cargar();
  }

  async function borrarTodasLasVotaciones() {
    if (
      !confirm(
        "⚠️ Esto borra TODAS las votaciones para empezar de cero. ¿Seguro?",
      )
    )
      return;
    const segunda = prompt("Para confirmar, escribe REINICIAR:");
    if (segunda !== "REINICIAR") {
      alert("Cancelado.");
      return;
    }
    setReseteando(true);
    await adminFetch("/api/reset?votos=1", { method: "POST" });
    setReseteando(false);
    cargar();
  }

  async function crearTurno() {
    if (!nuevoTurnoNombre.trim()) return;
    await adminFetch("/api/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoTurnoNombre.trim() }),
    });
    setNuevoTurnoNombre("");
    cargar();
  }

  async function editarTurno(t: Turno) {
    const nombre = prompt("Nombre del turno:", t.nombre);
    if (nombre === null) return;
    await adminFetch("/api/turnos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, nombre, activo: !t.activo }),
    });
    cargar();
  }

  async function borrarTurno(t: Turno) {
    const count = jugadores.filter((j) => j.turno === t.id).length;
    if (
      !confirm(
        `¿Borrar el turno "${t.nombre}"?${count > 0 ? ` Tiene ${count} jugador(es).` : ""}`,
      )
    )
      return;
    await adminFetch(`/api/turnos?id=${t.id}`, { method: "DELETE" });
    cargar();
  }

  // ---- Historial ----
  function abrirHistorial() {
    adminFetch("/api/historial?limit=30")
      .then((r) => r.json())
      .then((data: HistorialItem[]) => setHistorial(data));
  }

  const progresoGlobal = () => {
    if (jugadores.length === 0) return 0;
    const total = jugadores.reduce(
      (acc, j) => acc + j.votosHechos / Math.max(1, j.totalPosibles),
      0,
    );
    return Math.round((total / jugadores.length) * 100);
  };

  const confirmadosCount = jugadores.filter((j) => j.confirmado).length;
  const sinTurno = jugadores.filter(
    (j) => !j.turno || !turnos.some((t) => t.id === j.turno),
  );
  const todosGrupos = [
    ...turnos,
    ...(sinTurno.length > 0
      ? [{ id: "", nombre: "Sin turno", activo: true, orden: 999 }]
      : []),
  ];

  function formatearFecha(ms: number) {
    try {
      return new Date(ms).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  }

  function renderGrupo(grupoId: string, grupoNombre: string) {
    const js = jugadores.filter((j) => j.turno === grupoId);
    if (js.length === 0 && grupoId !== "") return null;
    const idsGrupo = js.map((j) => j.id);
    const todosSelGrupo =
      js.length > 0 && idsGrupo.every((id) => seleccion.has(id));
    return (
      <div key={grupoId || "sinturno"}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {grupoNombre}
          <span style={{ fontSize: "0.8rem", color: "var(--texto-suave)" }}>
            ({js.filter((j) => j.confirmado).length}/{js.length} confirmados)
          </span>
          {js.length > 0 && (
            <label
              style={{
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--texto-suave)",
              }}
            >
              <input
                type="checkbox"
                checked={todosSelGrupo}
                onChange={() => seleccionarTurno(idsGrupo)}
                style={{ width: 16, height: 16, accentColor: "var(--acento)" }}
              />
              Todos
            </label>
          )}
        </h2>
        <div className="tarjeta">
          {js.length > 0 && grupoId !== "" && (
            <div style={{ marginBottom: 10 }}>
              <button
                className="copiar-btn"
                onClick={() => copiarLinksTurno(grupoId)}
                style={{ fontSize: "0.72rem" }}
              >
                Copiar links de este turno
              </button>
            </div>
          )}
          {js.length === 0 ? (
            <p className="subtitulo" style={{ margin: 0, textAlign: "center" }}>
              Sin jugadores
            </p>
          ) : (
            js.map((j) => {
              const sel = seleccion.has(j.id);
              return (
                <div
                  className="link-jugador"
                  key={j.id}
                  style={{
                    flexWrap: "wrap",
                    background: sel ? "var(--acento-suave)" : "transparent",
                    borderRadius: sel ? "var(--radio-sm)" : 0,
                    padding: sel ? "10px" : "14px 0",
                  }}
                >
                  {editandoId === j.id ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        width: "100%",
                      }}
                    >
                      <input
                        className="campo-input"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        placeholder="Nombre"
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <SelectPosicion
                          value={editPosicion}
                          onChange={setEditPosicion}
                          className="campo-select"
                          style={{ flex: 1 }}
                        />
                        <select
                          className="campo-select"
                          value={editTurno}
                          onChange={(e) => setEditTurno(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          {turnos.map((tt) => (
                            <option key={tt.id} value={tt.id}>
                              {tt.nombre}
                            </option>
                          ))}
                          <option value="">Sin turno</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="copiar-btn"
                          onClick={() => editarJugador(j)}
                          style={{ flex: 1 }}
                        >
                          Guardar
                        </button>
                        <button
                          className="copiar-btn"
                          onClick={() => setEditandoId(null)}
                          style={{ flex: 1 }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          flexWrap: "wrap",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleSeleccion(j.id)}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => toggleSeleccion(j.id)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: "var(--acento)",
                          }}
                        />
                        {j.nombre}
                        <span className={`chip chip-${j.posicion}`}>
                          {j.posicion}
                        </span>
                        {j.confirmado && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              color: "#16a34a",
                              background: "rgba(22, 163, 74, 0.12)",
                              padding: "2px 8px",
                              borderRadius: 999,
                            }}
                          >
                            ✓ Voy
                          </span>
                        )}
                        {j.totalPosibles > 0 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              color:
                                j.votosHechos === j.totalPosibles
                                  ? "#16a34a"
                                  : "var(--texto-suave)",
                            }}
                          >
                            {j.votosHechos}/{j.totalPosibles}
                          </span>
                        )}
                      </span>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button
                          className="copiar-btn"
                          onClick={() => verStats(j)}
                          style={{ fontSize: "0.7rem" }}
                        >
                          Stats
                        </button>
                        <button
                          className="copiar-btn"
                          onClick={() => copiar(`${origen}/votar/${j.token}`)}
                          style={{ fontSize: "0.7rem" }}
                        >
                          Link
                        </button>
                        <button
                          className="copiar-btn"
                          onClick={() => iniciarEdicion(j)}
                          style={{ fontSize: "0.7rem" }}
                        >
                          Editar
                        </button>
                        <button
                          className="copiar-btn"
                          onClick={() => eliminar(j.id)}
                          style={{
                            color: "var(--del-texto)",
                            background: "var(--del-bg)",
                            border: "none",
                            fontSize: "0.7rem",
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor admin-contenedor">
      <div className="marca animar-entrada">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <h1 className="animar-entrada animar-retraso-1">Panel de admin</h1>
      <p className="subtitulo animar-entrada animar-retraso-1">
        Gestiona turnos, jugadores e inicia cada semana.
      </p>

      {/* Grid horizontal */}
      <div className="admin-grid">
        {/* IMPORTAR PLANTILLA */}
        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2 style={{ marginBottom: 14 }}>Importar plantilla</h2>
          <p
            className="subtitulo"
            style={{ marginBottom: 12, fontSize: "0.85rem" }}
          >
            Pega nombres (uno por línea o coma).
          </p>
          <div className="fila-atributo" style={{ marginBottom: 10 }}>
            <label>Turno</label>
            <select
              className="campo-select"
              value={bulkTurno}
              onChange={(e) => setBulkTurno(e.target.value)}
            >
              {turnos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="fila-atributo" style={{ marginBottom: 10 }}>
            <label>Posición</label>
            <SelectPosicion value={bulkPosicion} onChange={setBulkPosicion} />
          </div>
          <textarea
            className="campo-input"
            value={bulkTexto}
            onChange={(e) => setBulkTexto(e.target.value)}
            placeholder={"Jorge\nAna\nLuis"}
            rows={4}
            style={{
              width: "100%",
              marginBottom: 10,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={bulkImport}
            disabled={importando}
            style={{ width: "100%", marginBottom: 8 }}
          >
            {importando
              ? "Importando..."
              : `Añadir ${bulkTexto.split(/[\n,]+/).filter((s) => s.trim()).length || ""}`}
          </button>
          <button
            className="boton-secundario"
            onClick={copiarTodosLinks}
            style={{ width: "100%", fontSize: "0.85rem", marginBottom: 8 }}
          >
            Copiar todos los links
          </button>
          <button
            className="boton-secundario"
            onClick={() => {
              navigator.clipboard.writeText(`${origen}/votar`);
              alert("Link único copiado ✅");
            }}
            style={{ width: "100%", fontSize: "0.85rem" }}
          >
            Copiar link único (para todos)
          </button>
        </div>

        {/* FICHAR (sin turno) */}
        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2 style={{ marginBottom: 14 }}>Fichar jugador</h2>
          <p
            className="subtitulo"
            style={{ marginBottom: 12, fontSize: "0.85rem" }}
          >
            Crea la ficha sin asignar turno. Lo asignas después.
          </p>
          <div
            className="fila-atributo"
            style={{ marginBottom: 10, alignItems: "stretch" }}
          >
            <label>Nombre</label>
            <input
              className="campo-input"
              value={fichaNombre}
              onChange={(e) => setFichaNombre(e.target.value)}
              placeholder="Nuevo jugador"
            />
          </div>
          <div className="fila-atributo" style={{ marginBottom: 14 }}>
            <label>Posición</label>
            <SelectPosicion value={fichaPosicion} onChange={setFichaPosicion} />
          </div>
          <button onClick={fichar} disabled={fichando}>
            {fichando ? "Fichando..." : "Fichar jugador"}
          </button>
        </div>

        {/* TURNOS */}
        <div className="tarjeta animar-entrada animar-retraso-2">
          <h2 style={{ marginBottom: 14 }}>Turnos</h2>
          {turnos.map((t) => (
            <div className="link-jugador" key={t.id}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {t.nombre}
                {!t.activo && (
                  <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                    (inactivo)
                  </span>
                )}
                <span
                  style={{ fontSize: "0.7rem", color: "var(--texto-suave)" }}
                >
                  {jugadores.filter((j) => j.turno === t.id).length} j.
                </span>
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="copiar-btn"
                  onClick={() => editarTurno(t)}
                  style={{ fontSize: "0.72rem" }}
                >
                  {t.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  className="copiar-btn"
                  onClick={() => borrarTurno(t)}
                  style={{
                    color: "var(--del-texto)",
                    background: "var(--del-bg)",
                    border: "none",
                    fontSize: "0.72rem",
                  }}
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <input
              className="campo-input"
              style={{ flex: 1 }}
              value={nuevoTurnoNombre}
              onChange={(e) => setNuevoTurnoNombre(e.target.value)}
              placeholder="Nuevo turno"
              onKeyDown={(e) => e.key === "Enter" && crearTurno()}
            />
            <button
              onClick={crearTurno}
              style={{
                width: "auto",
                padding: "12px 18px",
                whiteSpace: "nowrap",
              }}
            >
              Añadir
            </button>
          </div>
        </div>

        {/* PROGRESO */}
        <div
          className="tarjeta animar-entrada animar-retraso-2"
          style={{ textAlign: "center" }}
        >
          <span
            className="subtitulo"
            style={{ marginBottom: 12, display: "block" }}
          >
            Votaciones
          </span>
          <div className="progreso">
            <div
              className="progreso-relleno"
              style={{
                width: `${progresoGlobal()}%`,
                background: "var(--acento)",
              }}
            />
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--texto-suave)" }}>
            {progresoGlobal()}% · {confirmadosCount} confirmados
          </span>
        </div>
      </div>

      {/* Historial */}
      <div className="tarjeta animar-entrada" style={{ marginTop: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Historial de equipos</h2>
          <button
            className="copiar-btn"
            onClick={abrirHistorial}
            style={{ fontSize: "0.72rem" }}
          >
            Cargar
          </button>
        </div>
        {historial.length === 0 ? (
          <p className="subtitulo" style={{ margin: 0 }}>
            Pulsa Cargar para ver los últimos equipos.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historial.map((h) => (
              <div
                key={h.id}
                style={{
                  border: "1px solid var(--cristal-borde)",
                  borderRadius: "var(--radio-sm)",
                  padding: 12,
                }}
              >
                <button
                  onClick={() =>
                    setHistorialExpandido(
                      historialExpandido === h.id ? null : h.id,
                    )
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--texto)",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  <span>
                    {h.turnoNombre} · {formatearFecha(h.fecha)}
                  </span>
                  <span
                    style={{
                      color:
                        h.diferencia === 0
                          ? "var(--acento)"
                          : "var(--texto-suave)",
                      fontSize: "0.8rem",
                    }}
                  >
                    A {h.totalA} — B {h.totalB} (Δ {h.diferencia})
                  </span>
                </button>
                {historialExpandido === h.id && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--texto-suave)",
                          marginBottom: 6,
                        }}
                      >
                        Equipo A — {h.totalA}
                      </div>
                      {h.equipoA.map((j) => (
                        <div
                          key={j.id}
                          style={{
                            fontSize: "0.82rem",
                            marginBottom: 2,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {j.nombre}{" "}
                            <span
                              className={`chip chip-${j.posicion}`}
                              style={{ fontSize: "0.6rem" }}
                            >
                              {j.posicion}
                            </span>
                          </span>
                          <span style={{ color: "var(--texto-suave)" }}>
                            {j.notaPosicion}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--texto-suave)",
                          marginBottom: 6,
                        }}
                      >
                        Equipo B — {h.totalB}
                      </div>
                      {h.equipoB.map((j) => (
                        <div
                          key={j.id}
                          style={{
                            fontSize: "0.82rem",
                            marginBottom: 2,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            {j.nombre}{" "}
                            <span
                              className={`chip chip-${j.posicion}`}
                              style={{ fontSize: "0.6rem" }}
                            >
                              {j.posicion}
                            </span>
                          </span>
                          <span style={{ color: "var(--texto-suave)" }}>
                            {j.notaPosicion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones peligrosos */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          className="boton-secundario"
          onClick={nuevaSemana}
          disabled={reseteando}
          style={{
            width: "auto",
            flex: 1,
            minWidth: 200,
            fontSize: "0.85rem",
            padding: "10px 16px",
          }}
        >
          {reseteando ? "Iniciando..." : "Nueva semana — reiniciar asistencias"}
        </button>
        <button
          onClick={borrarTodasLasVotaciones}
          disabled={reseteando}
          style={{
            width: "auto",
            flex: 1,
            minWidth: 200,
            background: "rgba(220,38,38,0.06)",
            color: "#dc2626",
            border: "1px solid rgba(220,38,38,0.2)",
            padding: "8px 16px",
            borderRadius: "var(--radio-sm)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⚠️ Reiniciar votaciones
        </button>
      </div>

      {/* Grupos de jugadores */}
      {todosGrupos.map((g) => renderGrupo(g.id, g.nombre || "Sin turno"))}

      {/* Barra bulk */}
      {seleccion.size > 0 && (
        <div className="bulk-bar">
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {seleccion.size} seleccionados
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="copiar-btn"
              onClick={() => bulkConfirmar(true)}
              disabled={bulkAcciones}
              style={{
                fontSize: "0.78rem",
                color: "#16a34a",
                borderColor: "rgba(22,163,74,0.3)",
              }}
            >
              Confirmar
            </button>
            <button
              className="copiar-btn"
              onClick={() => bulkConfirmar(false)}
              disabled={bulkAcciones}
              style={{ fontSize: "0.78rem" }}
            >
              Quitar ✓
            </button>
            <button
              className="copiar-btn"
              onClick={bulkEliminar}
              disabled={bulkAcciones}
              style={{
                fontSize: "0.78rem",
                color: "#dc2626",
                borderColor: "rgba(220,38,38,0.3)",
              }}
            >
              Eliminar
            </button>
            <button
              className="copiar-btn"
              onClick={limpiarSeleccion}
              style={{ fontSize: "0.78rem" }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Modal stats */}
      {statsAbierta && (
        <div
          onClick={() => setStatsAbierta(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tarjeta"
            style={{
              maxWidth: 420,
              width: "100%",
              animation: "entrar 0.3s ease-out both",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0 }}>{statsAbierta.nombre}</h2>
              <button
                className="copiar-btn"
                onClick={() => setStatsAbierta(null)}
                style={{ fontSize: "0.72rem" }}
              >
                Cerrar
              </button>
            </div>
            {statsCargando ? (
              <p className="subtitulo" style={{ textAlign: "center" }}>
                Cargando...
              </p>
            ) : statsData ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <span
                    className="subtitulo"
                    style={{ display: "block", fontSize: "0.8rem" }}
                  >
                    Nota global
                  </span>
                  <strong
                    style={{
                      fontSize: "2.2rem",
                      fontFamily: "var(--font-fraunces), serif",
                      color: "var(--acento)",
                    }}
                  >
                    {statsData.notaGlobal}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "var(--texto-suave)",
                    }}
                  >
                    {statsData.numVotos} voto(s)
                  </span>
                </div>
                {(
                  [
                    ["Ritmo", statsData.ritmo],
                    ["Resistencia", statsData.resistencia],
                    ["Técnica", statsData.tecnica],
                    ["Remate", statsData.remate],
                    ["Defensa", statsData.defensa],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        marginBottom: 4,
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontWeight: 600 }}>{val}</span>
                    </div>
                    <div
                      className="progreso"
                      style={{ height: 6, marginBottom: 0 }}
                    >
                      <div
                        className="progreso-relleno"
                        style={{
                          width: `${(val / 10) * 100}%`,
                          background: "var(--acento)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="subtitulo" style={{ textAlign: "center" }}>
                Sin datos.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
