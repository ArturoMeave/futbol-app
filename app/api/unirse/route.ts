import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  getJugadores,
  getTurnosActivos,
  getJugadorPorNombre,
  insertJugador,
  checkPalabraAcceso,
  Jugador,
} from "@/lib/db";
import { nanoid } from "nanoid";

// GET: lista de jugadores ya inscritos (sin token, solo nombre/posicion/turno)
// para que la gente vea quién va antes de apuntarse
export async function GET() {
  const [jugadores, turnos] = await Promise.all([getJugadores(), getTurnosActivos()]);
  const turnosMap = new Map(turnos.map((t) => [t.id, t.nombre]));

  const inscritos = jugadores.map((j) => ({
    id: j.id,
    nombre: j.nombre,
    posicion: j.posicion,
    turnoNombre: turnosMap.get(j.turno) ?? j.turno,
  }));

  return NextResponse.json({
    inscritos,
    turnos: turnos.map((t) => ({ id: t.id, nombre: t.nombre })),
  });
}

// POST: registra un jugador nuevo (self-signup)
// body: { nombre, posicion, turno, palabraAcceso }
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`join:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }
  const body = await req.json();
  const { nombre, posicion, turno, palabraAcceso } = body;

  if (!nombre || !posicion || !turno) {
    return NextResponse.json(
      { error: "Faltan campos (nombre, posicion, turno)" },
      { status: 400 }
    );
  }

  if (!checkPalabraAcceso(palabraAcceso ?? null)) {
    return NextResponse.json(
      { error: "Palabra de acceso incorrecta" },
      { status: 403 }
    );
  }

  // Validar duplicados por nombre (case-insensitive)
  const existente = await getJugadorPorNombre(nombre.trim());
  if (existente) {
    return NextResponse.json(
      { error: `Ya existe un jugador llamado "${nombre.trim()}". Si eres tú, pide tu link al admin.` },
      { status: 409 }
    );
  }

  const nuevo: Jugador = {
    id: nanoid(8),
    nombre: nombre.trim(),
    posicion,
    turno,
    token: `tok-${nanoid(12)}`,
    confirmado: false,
    votacionFinalizada: false,
  };
  await insertJugador(nuevo);

  return NextResponse.json({ token: nuevo.token, id: nuevo.id });
}
