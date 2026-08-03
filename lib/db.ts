import { supabase } from "./supabase";

export type Posicion = "POR" | "DEF" | "MED" | "DEL";

export interface Jugador {
  id: string;
  nombre: string;
  posicion: Posicion;
  turno: 1 | 2;
  token: string;
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

// Solo lo usan funciones internas (algoritmo) que ya reciben datos ya cargados
export interface DB {
  jugadores: Jugador[];
  votos: Voto[];
}

// ---- Mapeo snake_case (Supabase) <-> camelCase (app) ----
interface JugadorRow {
  id: string;
  nombre: string;
  posicion: Posicion;
  turno: number;
  token: string;
}

interface VotoRow {
  votante_id: string;
  objetivo_id: string;
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
}

function mapJugador(r: JugadorRow): Jugador {
  return {
    id: r.id,
    nombre: r.nombre,
    posicion: r.posicion,
    turno: r.turno as 1 | 2,
    token: r.token,
  };
}

function mapVoto(r: VotoRow): Voto {
  return {
    votanteId: r.votante_id,
    objetivoId: r.objetivo_id,
    ritmo: r.ritmo,
    resistencia: r.resistencia,
    tecnica: r.tecnica,
    remate: r.remate,
    defensa: r.defensa,
  };
}

// ---- Jugadores ----
export async function getJugadores(): Promise<Jugador[]> {
  const { data, error } = await supabase.from("jugadores").select("*");
  if (error) throw error;
  return (data as JugadorRow[]).map(mapJugador);
}

export async function getJugadorPorToken(token: string): Promise<Jugador | null> {
  const { data, error } = await supabase
    .from("jugadores")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJugador(data as JugadorRow) : null;
}

export async function insertJugador(j: Jugador): Promise<void> {
  const { error } = await supabase.from("jugadores").insert({
    id: j.id,
    nombre: j.nombre,
    posicion: j.posicion,
    turno: j.turno,
    token: j.token,
  });
  if (error) throw error;
}

export async function deleteJugador(id: string): Promise<void> {
  // Los votos se borran solos por ON DELETE CASCADE (ver SQL)
  const { error } = await supabase.from("jugadores").delete().eq("id", id);
  if (error) throw error;
}

// ---- Votos ----
export async function getVotos(): Promise<Voto[]> {
  const { data, error } = await supabase.from("votos").select("*");
  if (error) throw error;
  return (data as VotoRow[]).map(mapVoto);
}

export async function getVotosDeVotante(votanteId: string): Promise<Voto[]> {
  const { data, error } = await supabase
    .from("votos")
    .select("*")
    .eq("votante_id", votanteId);
  if (error) throw error;
  return (data as VotoRow[]).map(mapVoto);
}

export async function upsertVoto(v: Voto): Promise<void> {
  const { error } = await supabase.from("votos").upsert(
    {
      votante_id: v.votanteId,
      objetivo_id: v.objetivoId,
      ritmo: v.ritmo,
      resistencia: v.resistencia,
      tecnica: v.tecnica,
      remate: v.remate,
      defensa: v.defensa,
    },
    { onConflict: "votante_id,objetivo_id" }
  );
  if (error) throw error;
}

export async function resetVotos(): Promise<void> {
  const { error } = await supabase.from("votos").delete().neq("id", 0);
  if (error) throw error;
}

// ---- Helper para el algoritmo: cargar todo de golpe ----
export async function readDB(): Promise<DB> {
  const [jugadores, votos] = await Promise.all([
    getJugadores(),
    getVotos(),
  ]);
  return { jugadores, votos };
}

// ---- Auth admin (MVP) ----
export function checkAdminSecret(headerValue: string | null): boolean {
  const secreto = process.env.NEXT_PUBLIC_ADMIN_SECRET;
  if (!secreto) return true; // Si no está configurado, permitido (dev local)
  return secreto === headerValue;
}