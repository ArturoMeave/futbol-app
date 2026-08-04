import { NextRequest, NextResponse } from "next/server";
import {
  insertHistorialEquipos,
  getHistorialEquipos,
  checkAdminSecret,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const turnoId = req.nextUrl.searchParams.get("turno") ?? undefined;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const data = await getHistorialEquipos(turnoId, limit);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { turnoId, turnoNombre, totalA, totalB, diferencia, equipoA, equipoB } = body;
  if (!turnoId || !equipoA || !equipoB) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  await insertHistorialEquipos({
    turnoId,
    turnoNombre: turnoNombre ?? turnoId,
    totalA: Number(totalA),
    totalB: Number(totalB),
    diferencia: Number(diferencia),
    equipoA,
    equipoB,
  });
  return NextResponse.json({ ok: true });
}