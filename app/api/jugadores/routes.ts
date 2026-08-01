import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, Jugador } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.jugadores);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, posicion, turno } = body;

  if (!nombre || !posicion || !turno) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const db = readDB();
  const nuevo: Jugador = {
    id: nanoid(8),
    nombre,
    posicion,
    turno,
    token: `tok-${nombre.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`,
  };
  db.jugadores.push(nuevo);
  writeDB(db);

  return NextResponse.json(nuevo);
}