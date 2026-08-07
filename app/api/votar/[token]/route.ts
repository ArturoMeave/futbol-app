import { NextRequest, NextResponse } from "next/server";
import {
  getJugadorPorToken,
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
      votacionFinalizada: votante.votacionFinalizada,
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`vote:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }
  const votante = await getJugadorPorToken(params.token);

  if (!votante) {
    return NextResponse.json({ error: "Link no válido" }, { status: 404 });
  }

  let body: { votos?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const votos = body?.votos as Array<{
    objetivoId: string;
    ritmo: number;
    resistencia: number;
    tecnica: number;
    remate: number;
    defensa: number;
    posicionVotada: Posicion;
  }>;

  if (votante.votacionFinalizada || !Array.isArray(votos) || votos.length > 100) {
    return NextResponse.json({ error: "Votación ya finalizada o datos inválidos" }, { status: 409 });
  }
  const jugadores = await getJugadores();
  const objetivos = jugadores.filter((j) => j.turno === votante.turno && j.id !== votante.id);
  const permitidos = new Set(objetivos.map((j) => j.id));
  if (votos.length !== objetivos.length || new Set(votos.map((v) => v.objetivoId)).size !== votos.length || votos.some((v) => !permitidos.has(v.objetivoId))) {
    return NextResponse.json({ error: "Lista de objetivos inválida" }, { status: 400 });
  }

  // Validamos valores y posición recibidos del cliente.
  for (const v of votos) {
    if (!v || typeof v.objetivoId !== "string") {
      return NextResponse.json({ error: "Voto inválido" }, { status: 400 });
    }
    const atributos = [v.ritmo, v.resistencia, v.tecnica, v.remate, v.defensa];
    if (atributos.some((a) => a < 1 || a > 10 || !Number.isInteger(a))) {
      return NextResponse.json(
        { error: "Los valores deben ser enteros del 1 al 10" },
        { status: 400 }
      );
    }
    if (!POSICIONES.includes(v.posicionVotada)) {
      return NextResponse.json({ error: "Posición inválida" }, { status: 400 });
    }
  }

  // 2. Empaquetamos todo asociándolo al ID del votante que sacamos del token
  const votosParaGuardar = votos.map((v) => ({
    votanteId: votante.id,
    objetivoId: v.objetivoId,
    ritmo: v.ritmo,
    resistencia: v.resistencia,
    tecnica: v.tecnica,
    remate: v.remate,
    defensa: v.defensa,
    posicionVotada: v.posicionVotada ?? null,
  }));

  // 3. Inyección en bloque
  await upsertVotosBatch(votosParaGuardar);
  await finalizarVotacion(votante.id);

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
