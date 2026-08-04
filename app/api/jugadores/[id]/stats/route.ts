import { NextRequest, NextResponse } from "next/server";
import { getJugadorStats, checkAdminSecret } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  const stats = await getJugadorStats(id);
  if (!stats) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(stats);
}
