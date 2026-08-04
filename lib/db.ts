import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

export type Posicion =
  | "POR"
  | "LD"
  | "DFC"
  | "LI"
  | "MCD"
  | "MC"
  | "MP"
  | "EX"
  | "DEL";

export const POSICIONES: Posicion[] = [
  "POR",
  "LD",
  "DFC",
  "LI",
  "MCD",
  "MC",
  "MP",
  "EX",
  "DEL",
];

export const POSICION_LABELS: Record<Posicion, string> = {
  POR: "Portero",
  LD: "Lateral Der.",
  DFC: "Defensa Central",
  LI: "Lateral Izq.",
  MCD: "Pivote",
  MC: "Medio",
  MP: "Mediapunta",
  EX: "Extremo",
  DEL: "Delantero",
};

export interface Turno {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
}

export interface Jugador {
  id: string;
  nombre: string;
  posicion: Posicion;
  turno: string; // id del turno (text)
  token: string;
  confirmado: boolean;
}

export interface JugadorStats {
  id: string;
  nombre: string;
  posicion: Posicion;
  numVotos: number;
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
  notaGlobal: number;
}

export interface HistorialEquipos {
  id: number;
  turnoId: string;
  turnoNombre: string;
  fecha: string;
  totalA: number;
  totalB: number;
  diferencia: number;
  equipoA: any;
  equipoB: any;
}

export interface Voto {
  votanteId: string;
  objetivoId: string;
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
  posicionVotada: Posicion | null;
}

export interface DB {
  jugadores: Jugador[];
  votos: Voto[];
}

const sql = neon(process.env.DATABASE_URL!);

// ---- Turnos ----

export async function getTurnos(): Promise<Turno[]> {
  const data =
    await sql`SELECT id, nombre, activo, orden FROM turnos ORDER BY orden ASC`;
  return data as Turno[];
}

export async function getTurnosActivos(): Promise<Turno[]> {
  const data =
    await sql`SELECT id, nombre, activo, orden FROM turnos WHERE activo = true ORDER BY orden ASC`;
  return data as Turno[];
}

export async function insertTurno(t: Turno): Promise<void> {
  await sql`
    INSERT INTO turnos (id, nombre, activo, orden)
    VALUES (${t.id}, ${t.nombre}, ${t.activo}, ${t.orden})
  `;
}

export async function updateTurno(
  id: string,
  nombre: string,
  activo: boolean
): Promise<void> {
  await sql`
    UPDATE turnos SET nombre = ${nombre}, activo = ${activo} WHERE id = ${id}
  `;
}

export async function deleteTurno(id: string): Promise<void> {
  await sql`DELETE FROM turnos WHERE id = ${id}`;
}

// ---- Jugadores ----

export async function getJugadores(): Promise<Jugador[]> {
  const data = await sql`
    SELECT id, nombre, posicion, turno, token, confirmado FROM jugadores
  `;
  return data as Jugador[];
}

export async function getJugadorPorToken(token: string): Promise<Jugador | null> {
  const data = await sql`
    SELECT id, nombre, posicion, turno, token, confirmado
    FROM jugadores WHERE token = ${token} LIMIT 1
  `;
  return data.length > 0 ? (data[0] as Jugador) : null;
}

export async function getJugadorPorNombre(
  nombre: string
): Promise<Jugador | null> {
  const data = await sql`
    SELECT id FROM jugadores WHERE lower(nombre) = lower(${nombre}) LIMIT 1
  `;
  return data.length > 0 ? (data[0] as Jugador) : null;
}

export async function insertJugador(j: Jugador): Promise<void> {
  await sql`
    INSERT INTO jugadores (id, nombre, posicion, turno, token, confirmado)
    VALUES (${j.id}, ${j.nombre}, ${j.posicion}, ${j.turno}, ${j.token}, ${j.confirmado})
  `;
}

export async function insertJugadoresBatch(js: Jugador[]): Promise<void> {
  if (js.length === 0) return;
  for (const j of js) {
    await sql`
      INSERT INTO jugadores (id, nombre, posicion, turno, token, confirmado)
      VALUES (${j.id}, ${j.nombre}, ${j.posicion}, ${j.turno}, ${j.token}, ${j.confirmado})
    `;
  }
}

export async function updateJugador(
  id: string,
  nombre: string,
  posicion: Posicion,
  turno: string
): Promise<void> {
  await sql`
    UPDATE jugadores SET nombre = ${nombre}, posicion = ${posicion}, turno = ${turno}
    WHERE id = ${id}
  `;
}

export async function getJugadorStats(id: string): Promise<JugadorStats | null> {
  const data = await sql`
    SELECT j.id, j.nombre, j.posicion,
      COALESCE(AVG(v.ritmo), 5) AS ritmo,
      COALESCE(AVG(v.resistencia), 5) AS resistencia,
      COALESCE(AVG(v.tecnica), 5) AS tecnica,
      COALESCE(AVG(v.remate), 5) AS remate,
      COALESCE(AVG(v.defensa), 5) AS defensa,
      COUNT(v.votante_id) AS "numVotos"
    FROM jugadores j
    LEFT JOIN votos v ON v.objetivo_id = j.id
    WHERE j.id = ${id}
    GROUP BY j.id, j.nombre, j.posicion
  `;
  if (data.length === 0) return null;
  const r = data[0] as any;
  const notaGlobal =
    (Number(r.ritmo) + Number(r.resistencia) + Number(r.tecnica) + Number(r.remate) + Number(r.defensa)) /
    5;
  return {
    id: r.id,
    nombre: r.nombre,
    posicion: r.posicion,
    numVotos: Number(r.numVotos),
    ritmo: Math.round(Number(r.ritmo) * 10) / 10,
    resistencia: Math.round(Number(r.resistencia) * 10) / 10,
    tecnica: Math.round(Number(r.tecnica) * 10) / 10,
    remate: Math.round(Number(r.remate) * 10) / 10,
    defensa: Math.round(Number(r.defensa) * 10) / 10,
    notaGlobal: Math.round(notaGlobal * 10) / 10,
  };
}

export async function deleteJugador(id: string): Promise<void> {
  await sql`DELETE FROM jugadores WHERE id = ${id}`;
}

export async function setConfirmado(
  jugadorId: string,
  confirmado: boolean
): Promise<void> {
  await sql`UPDATE jugadores SET confirmado = ${confirmado} WHERE id = ${jugadorId}`;
}

// ---- Votos ----

export async function getVotos(): Promise<Voto[]> {
  const data = await sql`
    SELECT votante_id AS "votanteId", objetivo_id AS "objetivoId",
           ritmo, resistencia, tecnica, remate, defensa, posicion_votada AS "posicionVotada"
    FROM votos
  `;
  return data as Voto[];
}

export async function getVotosDeVotante(votanteId: string): Promise<Voto[]> {
  const data = await sql`
    SELECT votante_id AS "votanteId", objetivo_id AS "objetivoId",
           ritmo, resistencia, tecnica, remate, defensa, posicion_votada AS "posicionVotada"
    FROM votos WHERE votante_id = ${votanteId}
  `;
  return data as Voto[];
}

export async function upsertVoto(v: Voto): Promise<void> {
  await sql`
    INSERT INTO votos (votante_id, objetivo_id, ritmo, resistencia, tecnica, remate, defensa, posicion_votada)
    VALUES (${v.votanteId}, ${v.objetivoId}, ${v.ritmo}, ${v.resistencia}, ${v.tecnica}, ${v.remate}, ${v.defensa}, ${v.posicionVotada ?? null})
    ON CONFLICT (votante_id, objetivo_id) DO UPDATE SET
      ritmo = EXCLUDED.ritmo,
      resistencia = EXCLUDED.resistencia,
      tecnica = EXCLUDED.tecnica,
      remate = EXCLUDED.remate,
      defensa = EXCLUDED.defensa,
      posicion_votada = EXCLUDED.posicion_votada
  `;
}

// Moda de la posición votada que ha recibido un jugador.
// Sin votos → null (la app cae a la posición de la ficha).
export function posicionEfectivaVotos(votos: Voto[], jugadorId: string): Posicion | null {
  const recibidos = votos.filter((v) => v.objetivoId === jugadorId && v.posicionVotada);
  if (recibidos.length === 0) return null;
  const conteo = new Map<Posicion, number>();
  for (const v of recibidos) {
    const p = v.posicionVotada as Posicion;
    conteo.set(p, (conteo.get(p) ?? 0) + 1);
  }
  let mejor: Posicion | null = null;
  let max = -1;
  for (const [p, n] of conteo) {
    if (n > max) {
      max = n;
      mejor = p;
    }
  }
  return mejor;
}

// ---- Ciclo semanal (NO borra votos, son de una sola vez en la vida) ----

export async function nuevaSemana(): Promise<void> {
  await sql`UPDATE jugadores SET confirmado = false`;
}

// ---- Reiniciar TODAS las votaciones (manual, raro) ----

export async function reiniciarVotos(): Promise<void> {
  await sql`DELETE FROM votos`;
  await sql`UPDATE jugadores SET confirmado = false`;
}

// ---- Helper ----

export async function readDB(): Promise<DB> {
  const [jugadores, votos] = await Promise.all([getJugadores(), getVotos()]);
  return { jugadores, votos };
}

// ---- Historial de equipos ----

export async function insertHistorialEquipos(h: Omit<HistorialEquipos, "id" | "fecha">): Promise<void> {
  await sql`
    INSERT INTO historial_equipos (turno_id, turno_nombre, total_a, total_b, diferencia, equipo_a, equipo_b)
    VALUES (${h.turnoId}, ${h.turnoNombre}, ${h.totalA}, ${h.totalB}, ${h.diferencia}, ${JSON.stringify(h.equipoA)}, ${JSON.stringify(h.equipoB)})
  `;
}

export async function getHistorialEquipos(turnoId?: string, limit = 20): Promise<HistorialEquipos[]> {
  const lim = Math.min(limit, 100);
  let data;
  if (turnoId) {
    data = await sql`
      SELECT id, turno_id AS "turnoId", turno_nombre AS "turnoNombre",
             EXTRACT(EPOCH FROM fecha) * 1000 AS fecha,
             total_a AS "totalA", total_b AS "totalB", diferencia,
             equipo_a AS "equipoA", equipo_b AS "equipoB"
      FROM historial_equipos
      WHERE turno_id = ${turnoId}
      ORDER BY fecha DESC
      LIMIT ${lim}
    `;
  } else {
    data = await sql`
      SELECT id, turno_id AS "turnoId", turno_nombre AS "turnoNombre",
             EXTRACT(EPOCH FROM fecha) * 1000 AS fecha,
             total_a AS "totalA", total_b AS "totalB", diferencia,
             equipo_a AS "equipoA", equipo_b AS "equipoB"
      FROM historial_equipos
      ORDER BY fecha DESC
      LIMIT ${lim}
    `;
  }
  return data as HistorialEquipos[];
}

// ---- Auth ----

export function checkAdminSecret(headerValue: string | null): boolean {
  const secreto = process.env.NEXT_PUBLIC_ADMIN_SECRET;
  if (!secreto) return true;
  return secreto === headerValue;
}

export function checkPalabraAcceso(palabra: string | null): boolean {
  const secreto = process.env.PALABRA_ACCESO;
  if (!secreto) return true; // dev local sin palabra
  return secreto === palabra;
}