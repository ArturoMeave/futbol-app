import { NextRequest, NextResponse } from "next/server";
import {
  Jugador,
  Posicion,
  getJugadores,
  insertJugador,
  insertJugadoresBatch,
  updateJugador,
  deleteJugador,
  setConfirmado,
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

function tokenPara(nombre: string): string {
  return `tok-${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;
}

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();

  if (Array.isArray(body)) {
    const nuevos: Jugador[] = body
      .filter((b) => b.nombre && b.turno)
      .map((b) => ({
        id: nanoid(8),
        nombre: String(b.nombre).trim(),
        posicion: (b.posicion as Posicion) || "MED",
        turno: b.turno,
        token: tokenPara(String(b.nombre).trim()),
        confirmado: false,
      }));
    if (nuevos.length === 0) {
      return NextResponse.json({ error: "Sin jugadores válidos" }, { status: 400 });
    }
    await insertJugadoresBatch(nuevos);
    return NextResponse.json({ ok: true, creados: nuevos.length, jugadores: nuevos });
  }

  const { nombre, posicion = "MED", turno } = body;

  if (!nombre) {
    return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  }

  const nuevo: Jugador = {
    id: nanoid(8),
    nombre: String(nombre).trim(),
    posicion,
    turno: turno ?? "",
    token: tokenPara(String(nombre).trim()),
    confirmado: false,
  };
  await insertJugador(nuevo);

  return NextResponse.json(nuevo);
}

export async function PATCH(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { id, ids, nombre, posicion, turno, confirmado } = body;

  // Bulk confirmar
  if (Array.isArray(ids) && typeof confirmado === "boolean" && nombre === undefined) {
    for (const jid of ids) {
      await setConfirmado(jid, confirmado);
    }
    return NextResponse.json({ ok: true, actualizados: ids.length });
  }

  // Toggle confirmado individual
  if (id && typeof confirmado === "boolean" && nombre === undefined) {
    await setConfirmado(id, confirmado);
    return NextResponse.json({ ok: true });
  }

  // Editar campos
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  if (!nombre || !posicion || !turno) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  await updateJugador(id, nombre, posicion, turno);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  const id = searchParams.get("id");

  if (ids) {
    const lista = ids.split(",").map((s) => s.trim()).filter(Boolean);
    for (const jid of lista) {
      await deleteJugador(jid);
    }
    return NextResponse.json({ ok: true, borrados: lista.length });
  }

  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  await deleteJugador(id);
  return NextResponse.json({ ok: true });
}