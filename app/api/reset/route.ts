import { NextRequest, NextResponse } from "next/server";
import { resetVotos, checkAdminSecret } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await resetVotos();
  return NextResponse.json({ ok: true });
}