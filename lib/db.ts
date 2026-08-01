import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

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

export interface DB {
  jugadores: Jugador[];
  votos: Voto[];
}

export function readDB(): DB {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDB(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}