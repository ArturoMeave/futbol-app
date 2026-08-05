// lib/constantes.ts
export type Posicion = "POR" | "LD" | "DFC" | "LI" | "MCD" | "MC" | "MP" | "EX" | "DEL";

export const POSICIONES: Posicion[] = [
  "POR", "LD", "DFC", "LI", "MCD", "MC", "MP", "EX", "DEL",
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