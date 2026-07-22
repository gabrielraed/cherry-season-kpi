import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createNextWeek } from "@/lib/data";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo la gerencia puede abrir una semana nueva." }, { status: 403 });
  }

  const week = await createNextWeek();
  return NextResponse.json({ id: week.id });
}
