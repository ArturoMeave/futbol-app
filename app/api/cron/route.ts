import { NextRequest, NextResponse } from "next/server";
import { nuevaSemana } from "@/lib/db";

// Vercel Cron: reset semanal de asistencias (lunes 00:00 UTC).
// Auth vía CRON_SECRET (Bearer). Si no hay secreto definido, no ejecuta.
export async function POST(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await nuevaSemana();
  return NextResponse.json({ ok: true, reset: true });
}

export async function GET(req: NextRequest) {
  return POST(req);
}