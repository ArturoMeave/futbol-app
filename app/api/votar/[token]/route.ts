import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";

// Devuelve quién es el votante y a quién puede votar (todos menos él mismo,
// del mismo turno)
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const db = readDB();
  const votante = db.jugadores.find((j) => j.token === params.token);

  if (!votante) {
    return NextResponse.json({ error: "Link no válido" }, { status: 404 });
  }

  const objetivos = db.jugadores.filter(
    (j) => j.turno === votante.turno && j.id !== votante.id
  );

  const yaVotadosIds = new Set(
    db.votos.filter((v) => v.votanteId === votante.id).map((v) => v.objetivoId)
  );

  const pendientes = objetivos.filter((o) => !yaVotadosIds.has(o.id));

  return NextResponse.json({
    votante: { id: votante.id, nombre: votante.nombre },
    objetivos: objetivos.map((o) => ({ id: o.id, nombre: o.nombre, posicion: o.posicion })),
    pendientesIds: pendientes.map((p) => p.id),
  });
}

// Recibe un array de votos: { objetivoId, ritmo, resistencia, tecnica, remate, defensa }
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const db = readDB();
  const votante = db.jugadores.find((j) => j.token === params.token);

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
  }>;

  for (const v of votos) {
    // Evita duplicados: si ya había votado a esa persona, se sobreescribe
    db.votos = db.votos.filter(
      (existing) => !(existing.votanteId === votante.id && existing.objetivoId === v.objetivoId)
    );
    db.votos.push({
      votanteId: votante.id,
      objetivoId: v.objetivoId,
      ritmo: v.ritmo,
      resistencia: v.resistencia,
      tecnica: v.tecnica,
      remate: v.remate,
      defensa: v.defensa,
    });
  }

  writeDB(db);
  return NextResponse.json({ ok: true });
}