import { NextRequest, NextResponse } from "next/server";
import {
  getJugadorPorToken,
  getJugadores,
  getVotosDeVotante,
  getTurnosActivos,
  upsertVoto,
  setConfirmado,
  Posicion,
} from "@/lib/db";

// Devuelve quién es el votante, a quién puede votar, su estado de confirmación
// y el nombre legible de su turno
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const votante = await getJugadorPorToken(params.token);

  if (!votante) {
    return NextResponse.json({ error: "Link no válido" }, { status: 404 });
  }

  const [jugadores, votosHechos, turnos] = await Promise.all([
    getJugadores(),
    getVotosDeVotante(votante.id),
    getTurnosActivos(),
  ]);

  const turnosMap = new Map(turnos.map((t) => [t.id, t.nombre]));

  const objetivos = jugadores.filter(
    (j) => j.turno === votante.turno && j.id !== votante.id
  );

  const yaVotadosIds = new Set(votosHechos.map((v) => v.objetivoId));

  const pendientes = objetivos.filter((o) => !yaVotadosIds.has(o.id));

  return NextResponse.json({
    votante: {
      id: votante.id,
      nombre: votante.nombre,
      confirmado: votante.confirmado,
    },
    turnoNombre: turnosMap.get(votante.turno) ?? votante.turno,
    objetivos: objetivos.map((o) => ({
      id: o.id,
      nombre: o.nombre,
      posicion: o.posicion,
    })),
    pendientesIds: pendientes.map((p) => p.id),
  });
}

// Recibe un array de votos: { objetivoId, ritmo, resistencia, tecnica, remate, defensa }
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const votante = await getJugadorPorToken(params.token);

  if (!votante) {
    return NextResponse.json({ error: "Link no válido" }, { status: 404 });
  }

  const body = await req.json();
  const votos = body.votos as Array<{
    objetivoId: string;
    ritmo: number;
    resistencia: number;
    tecnica: number;
    remate: number;
    defensa: number;
    posicionVotada: Posicion;
  }>;

  for (const v of votos) {
    const atributos = [v.ritmo, v.resistencia, v.tecnica, v.remate, v.defensa];
    if (atributos.some((a) => a < 1 || a > 10 || !Number.isInteger(a))) {
      return NextResponse.json(
        { error: "Los valores deben ser enteros del 1 al 10" },
        { status: 400 }
      );
    }
    await upsertVoto({
      votanteId: votante.id,
      objetivoId: v.objetivoId,
      ritmo: v.ritmo,
      resistencia: v.resistencia,
      tecnica: v.tecnica,
      remate: v.remate,
      defensa: v.defensa,
      posicionVotada: v.posicionVotada ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}

// PATCH: confirmar o desconfirmar asistencia
// body: { confirmado: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const votante = await getJugadorPorToken(params.token);

  if (!votante) {
    return NextResponse.json({ error: "Link no válido" }, { status: 404 });
  }

  const body = await req.json();
  const { confirmado } = body;

  await setConfirmado(votante.id, Boolean(confirmado));

  return NextResponse.json({ ok: true, confirmado: Boolean(confirmado) });
}