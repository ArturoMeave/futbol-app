import { NextRequest, NextResponse } from "next/server";
import {
  getJugadores,
  getTurnosActivos,
  getVotosDeVotante,
  upsertVotosBatch,
  setConfirmado,
  Posicion,
} from "@/lib/db";

// GET /api/votar            → lista de jugadores en turnos activos (para elegir quién soy)
// GET /api/votar?id=X       → bundle de votación del jugador X (votante + objetivos)
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const [jugadores, votosHechos, turnos] = await Promise.all([
      getJugadores(),
      getVotosDeVotante(id),
      getTurnosActivos(),
    ]);
    const votante = jugadores.find((j) => j.id === id);
    if (!votante) {
      return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
    }
    const turnosMap = new Map(turnos.map((t) => [t.id, t.nombre]));
    const objetivos = jugadores.filter(
      (j) => j.turno === votante.turno && j.id !== votante.id
    );
    const yaVotadosIds = new Set(votosHechos.map((v) => v.objetivoId));
    const pendientes = objetivos.filter((o) => !yaVotadosIds.has(o.id));
    return NextResponse.json({
      votante: { id: votante.id, nombre: votante.nombre, confirmado: votante.confirmado },
      turnoNombre: turnosMap.get(votante.turno) ?? votante.turno,
      objetivos: objetivos.map((o) => ({ id: o.id, nombre: o.nombre, posicion: o.posicion })),
      pendientesIds: pendientes.map((p) => p.id),
    });
  }

  // Lista general para elegir identidad
  const [jugadores, turnos] = await Promise.all([getJugadores(), getTurnosActivos()]);
  const turnosMap = new Map(turnos.map((t) => [t.id, t.nombre]));
  const activosIds = new Set(turnos.map((t) => t.id));
  const lista = jugadores
    .filter((j) => activosIds.has(j.turno))
    .map((j) => ({
      id: j.id,
      nombre: j.nombre,
      posicion: j.posicion,
      turnoId: j.turno,
      turnoNombre: turnosMap.get(j.turno) ?? j.turno,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  return NextResponse.json({
    jugadores: lista,
    turnos: turnos.map((t) => ({ id: t.id, nombre: t.nombre })),
  });
}

// POST /api/votar  body: { votanteId, votos: [{ objetivoId, ritmo, resistencia, tecnica, remate, defensa, posicionVotada }] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { votanteId, votos } = body as {
    votanteId: string;
    votos: Array<{
      objetivoId: string;
      ritmo: number;
      resistencia: number;
      tecnica: number;
      remate: number;
      defensa: number;
      posicionVotada: Posicion;
    }>;
  };

  if (!votanteId) {
    return NextResponse.json({ error: "Falta votanteId" }, { status: 400 });
  }

  // 1. Primero, validamos todos los votos para asegurarnos de que nadie hace trampas
  for (const v of votos) {
    const atributos = [v.ritmo, v.resistencia, v.tecnica, v.remate, v.defensa];
    if (atributos.some((a) => a < 1 || a > 10 || !Number.isInteger(a))) {
      return NextResponse.json(
        { error: "Los valores deben ser enteros del 1 al 10" },
        { status: 400 }
      );
    }
  }

  // 2. Preparamos la caja con todos los votos empaquetados
  const votosParaGuardar = votos.map((v) => ({
    votanteId: votanteId, // Añadimos quién vota a cada paquete
    objetivoId: v.objetivoId,
    ritmo: v.ritmo,
    resistencia: v.resistencia,
    tecnica: v.tecnica,
    remate: v.remate,
    defensa: v.defensa,
    posicionVotada: v.posicionVotada ?? null,
  }));

  // 3. Enviamos el camión de reparto de un solo viaje
  await upsertVotosBatch(votosParaGuardar);

  return NextResponse.json({ ok: true });
}

// PATCH /api/votar  body: { votanteId, confirmado }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { votanteId, confirmado } = body;
  if (!votanteId) {
    return NextResponse.json({ error: "Falta votanteId" }, { status: 400 });
  }
  await setConfirmado(votanteId, Boolean(confirmado));
  return NextResponse.json({ ok: true, confirmado: Boolean(confirmado) });
}
