import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { calcularJugadoresConNota, generarEquipos } from "@/lib/algoritmo";

export async function GET(req: NextRequest) {
  const turno = req.nextUrl.searchParams.get("turno") ?? "1";
  const soloConfirmados =
    req.nextUrl.searchParams.get("confirmados") !== "false"; // por defecto true

  const db = await readDB();
  let jugadores = calcularJugadoresConNota(db, turno);

  if (soloConfirmados) {
    jugadores = jugadores.filter((j) => j.confirmado);
  }

  if (jugadores.length < 2) {
    return NextResponse.json(
      {
        error: soloConfirmados
          ? "No hay suficientes jugadores confirmados en ese turno. Recuerda confirmar asistencia."
          : "No hay suficientes jugadores en ese turno",
      },
      { status: 400 }
    );
  }

  const resultado = generarEquipos(jugadores);
  return NextResponse.json(resultado);
}