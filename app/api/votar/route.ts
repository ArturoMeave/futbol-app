import { NextRequest, NextResponse } from "next/server";
import {
  getJugadores,
  getVotosDeVotante,
  getTurnosActivos,
  upsertVotosBatch,
  setConfirmado,
  finalizarVotacion,
  Posicion,
} from "@/lib/db";
import { POSICIONES } from "@/lib/constantes";
import { rateLimit } from "@/lib/rateLimit";

function limitada(req: NextRequest, clave: string, limite: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return rateLimit(`${clave}:${ip}`, limite, 60_000);
}

export async function GET(req: NextRequest) {
  if (!limitada(req, "voting-list", 60)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const id = req.nextUrl.searchParams.get("id");
  const jugadores = await getJugadores();
  const turnos = await getTurnosActivos();
  const activos = new Set(turnos.map((t) => t.id));
  const nombresTurno = new Map(turnos.map((t) => [t.id, t.nombre]));

  if (!id) {
    return NextResponse.json({
      jugadores: jugadores
        .filter((j) => activos.has(j.turno))
        .map(({ id, nombre, posicion, turno }) => ({
          id,
          nombre,
          posicion,
          turnoId: turno,
          turnoNombre: nombresTurno.get(turno) ?? turno,
        })),
    });
  }

  const votante = jugadores.find((j) => j.id === id && activos.has(j.turno));
  if (!votante) {
    return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  const [votosHechos] = await Promise.all([getVotosDeVotante(votante.id)]);
  const objetivos = jugadores.filter(
    (j) => j.turno === votante.turno && j.id !== votante.id,
  );

  return NextResponse.json({
    votante: {
      id: votante.id,
      nombre: votante.nombre,
      confirmado: votante.confirmado,
      votacionFinalizada: votante.votacionFinalizada,
    },
    turnoNombre: turnos.find((t) => t.id === votante.turno)?.nombre ?? votante.turno,
    objetivos: objetivos.map(({ id, nombre, posicion }) => ({ id, nombre, posicion })),
    pendientesIds: objetivos
      .filter((o) => !votosHechos.some((v) => v.objetivoId === o.id))
      .map((o) => o.id),
  });
}

export async function POST(req: NextRequest) {
  if (!limitada(req, "voting-submit", 20)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let body: { votanteId?: unknown; votos?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const votanteId = typeof body.votanteId === "string" ? body.votanteId : "";
  const votos = body.votos as Array<{
    objetivoId: string;
    ritmo: number;
    resistencia: number;
    tecnica: number;
    remate: number;
    defensa: number;
    posicionVotada: Posicion;
  }>;
  const jugadores = await getJugadores();
  const votante = jugadores.find((j) => j.id === votanteId);
  if (!votante || votante.votacionFinalizada || !Array.isArray(votos) || votos.length > 100) {
    return NextResponse.json({ error: "Votación o datos inválidos" }, { status: 400 });
  }

  const objetivos = jugadores.filter((j) => j.turno === votante.turno && j.id !== votante.id);
  const permitidos = new Set(objetivos.map((j) => j.id));
  if (
    votos.length !== objetivos.length ||
    new Set(votos.map((v) => v?.objetivoId)).size !== votos.length ||
    votos.some((v) => !v || !permitidos.has(v.objetivoId))
  ) {
    return NextResponse.json({ error: "Lista de objetivos inválida" }, { status: 400 });
  }

  for (const v of votos) {
    const atributos = [v.ritmo, v.resistencia, v.tecnica, v.remate, v.defensa];
    if (atributos.some((a) => !Number.isInteger(a) || a < 1 || a > 10)) {
      return NextResponse.json({ error: "Valores deben ser enteros del 1 al 10" }, { status: 400 });
    }
    if (!POSICIONES.includes(v.posicionVotada)) {
      return NextResponse.json({ error: "Posición inválida" }, { status: 400 });
    }
  }

  await upsertVotosBatch(votos.map((v) => ({ ...v, votanteId, posicionVotada: v.posicionVotada })));
  await finalizarVotacion(votanteId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  let body: { votanteId?: unknown; confirmado?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (typeof body.votanteId !== "string" || typeof body.confirmado !== "boolean") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const jugador = (await getJugadores()).find((j) => j.id === body.votanteId);
  if (!jugador) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  await setConfirmado(jugador.id, body.confirmado);
  return NextResponse.json({ ok: true, confirmado: body.confirmado });
}
