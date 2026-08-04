import { NextRequest, NextResponse } from "next/server";
import {
  getTurnos,
  insertTurno,
  updateTurno,
  deleteTurno,
  checkAdminSecret,
  Turno,
} from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const turnos = await getTurnos();
  return NextResponse.json(turnos);
}

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { nombre, activo = true } = body;
  if (!nombre) {
    return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  }
  const nuevo: Turno = {
    id: nanoid(6),
    nombre,
    activo,
    orden: Date.now() % 100000,
  };
  await insertTurno(nuevo);
  return NextResponse.json(nuevo);
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { id, nombre, activo } = body;
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  await updateTurno(id, nombre, activo);
  return NextResponse.json({ ok: true });
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
  await deleteTurno(id);
  return NextResponse.json({ ok: true });
}