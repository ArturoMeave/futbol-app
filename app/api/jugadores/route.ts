import { NextRequest, NextResponse } from "next/server";
import {
  Jugador,
  getJugadores,
  insertJugador,
  deleteJugador,
  getVotos,
  checkAdminSecret,
} from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const [jugadores, votos] = await Promise.all([getJugadores(), getVotos()]);
  const jugadoresConEstado = jugadores.map((j) => {
    const votosHechos = votos.filter((v) => v.votanteId === j.id).length;
    const totalPosibles = jugadores.filter(
      (x) => x.turno === j.turno && x.id !== j.id
    ).length;
    return { ...j, votosHechos, totalPosibles };
  });
  return NextResponse.json(jugadoresConEstado);
}

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { nombre, posicion, turno } = body;

  if (!nombre || !posicion || !turno) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const nuevo: Jugador = {
    id: nanoid(8),
    nombre,
    posicion,
    turno,
    token: `tok-${nombre.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`,
    confirmado: false,
  };
  await insertJugador(nuevo);

  return NextResponse.json(nuevo);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  await deleteJugador(id);

  return NextResponse.json({ ok: true });
}