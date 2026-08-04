import { NextRequest, NextResponse } from "next/server";
import { nuevaSemana, reiniciarVotos, checkAdminSecret } from "@/lib/db";

// POST /api/reset           -> solo reinicia asistencias (uso semanal)
// POST /api/reset?votos=1   -> borra TODAS las votaciones (uso raro/manual)
export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const borrarVotos = req.nextUrl.searchParams.get("votos") === "1";
  if (borrarVotos) {
    await reiniciarVotos();
  } else {
    await nuevaSemana();
  }
  return NextResponse.json({ ok: true, votosBorrados: borrarVotos });
}