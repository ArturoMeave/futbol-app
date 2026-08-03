import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { calcularJugadoresConNota, generarEquipos } from "@/lib/algoritmo";

export async function GET(req: NextRequest) {
  const turnoParam = req.nextUrl.searchParams.get("turno") ?? "1";
  const turno = turnoParam === "2" ? 2 : 1;

  const db = await readDB();
  const jugadores = calcularJugadoresConNota(db, turno);

  if (jugadores.length < 2) {
    return NextResponse.json(
      { error: "No hay suficientes jugadores en ese turno" },
      { status: 400 }
    );
  }

  const resultado = generarEquipos(jugadores);
  return NextResponse.json(resultado);
}