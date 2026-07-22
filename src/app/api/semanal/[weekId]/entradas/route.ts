import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, accessibleLocalIds } from "@/lib/auth";

const NUMERIC_FIELDS = [
  "ventas",
  "costoInsumos",
  "costoLaboral",
  "gastoEstructura",
  "comisionesApps",
  "marketing",
  "descartes",
  "vajilla",
  "ingresoCaja",
  "egresoCaja",
] as const;

export async function POST(req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { weekId } = await params;
  const body = await req.json().catch(() => null);
  const localId = typeof body?.localId === "string" ? body.localId : null;
  if (!localId) return NextResponse.json({ error: "Falta el local." }, { status: 400 });

  const allowedIds = await accessibleLocalIds(session);
  if (allowedIds && !allowedIds.includes(localId)) {
    return NextResponse.json({ error: "No tenés acceso a ese local." }, { status: 403 });
  }

  const data: Record<string, number> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = Number(body?.[field]);
    data[field] = Number.isFinite(value) ? value : 0;
  }
  const cantidadTickets = Number(body?.cantidadTickets);
  const notas = typeof body?.notas === "string" ? body.notas : null;

  const entry = await prisma.weeklyEntry.upsert({
    where: { weekId_localId: { weekId, localId } },
    update: {
      ...data,
      cantidadTickets: Number.isFinite(cantidadTickets) ? Math.round(cantidadTickets) : 0,
      notas,
      cargadoPorId: session.userId,
    },
    create: {
      weekId,
      localId,
      ...data,
      cantidadTickets: Number.isFinite(cantidadTickets) ? Math.round(cantidadTickets) : 0,
      notas,
      origen: "manual",
      cargadoPorId: session.userId,
    },
  });

  return NextResponse.json(entry);
}

/** Borra todos los datos cargados de la semana (todos los locales), dejándola en "Sin datos cargados". */
export async function DELETE(req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo la gerencia puede borrar una semana cargada." }, { status: 403 });
  }

  const { weekId } = await params;
  await prisma.weeklyEntry.deleteMany({ where: { weekId } });

  return NextResponse.json({ ok: true });
}
