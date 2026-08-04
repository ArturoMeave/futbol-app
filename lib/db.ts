import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

export type Posicion = "POR" | "DEF" | "MED" | "DEL";

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

export interface Voto {
  votanteId: string;
  objetivoId: string;
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
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
           ritmo, resistencia, tecnica, remate, defensa
    FROM votos
  `;
  return data as Voto[];
}

export async function getVotosDeVotante(votanteId: string): Promise<Voto[]> {
  const data = await sql`
    SELECT votante_id AS "votanteId", objetivo_id AS "objetivoId",
           ritmo, resistencia, tecnica, remate, defensa
    FROM votos WHERE votante_id = ${votanteId}
  `;
  return data as Voto[];
}

export async function upsertVoto(v: Voto): Promise<void> {
  await sql`
    INSERT INTO votos (votante_id, objetivo_id, ritmo, resistencia, tecnica, remate, defensa)
    VALUES (${v.votanteId}, ${v.objetivoId}, ${v.ritmo}, ${v.resistencia}, ${v.tecnica}, ${v.remate}, ${v.defensa})
    ON CONFLICT (votante_id, objetivo_id) DO UPDATE SET
      ritmo = EXCLUDED.ritmo,
      resistencia = EXCLUDED.resistencia,
      tecnica = EXCLUDED.tecnica,
      remate = EXCLUDED.remate,
      defensa = EXCLUDED.defensa
  `;
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