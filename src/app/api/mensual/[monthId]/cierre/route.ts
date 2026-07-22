import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, accessibleLocalIds } from "@/lib/auth";

const NUMERIC_FIELDS = [
  "ebitda",
  "resultadoOperativo",
  "resultadoNetoConsolidado",
  "flujoCajaOperativo",
  "flujoCajaInversion",
  "flujoCajaFinanciacion",
  "saldoCajaInicial",
  "saldoCajaFinal",
] as const;

export async function POST(req: Request, { params }: { params: Promise<{ monthId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { monthId } = await params;
  const body = await req.json().catch(() => null);
  const localId: string | null = typeof body?.localId === "string" ? body.localId : null;

  if (localId === null) {
    if (session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo la gerencia puede cargar el cierre mensual consolidado." },
        { status: 403 }
      );
    }
  } else {
    const allowedIds = await accessibleLocalIds(session);
    if (allowedIds && !allowedIds.includes(localId)) {
      return NextResponse.json({ error: "No tenés acceso a ese local." }, { status: 403 });
    }
  }

  const data: Record<string, number> = {};
  for (const field of NUMERIC_FIELDS) {
    const value = Number(body?.[field]);
    data[field] = Number.isFinite(value) ? value : 0;
  }
  const notas = typeof body?.notas === "string" ? body.notas : null;

  // localId nullable => se resuelve la unicidad a mano (ver nota en /api/ajustes/metas).
  const existing = await prisma.monthlyClose.findFirst({ where: { monthId, localId } });
  const close = existing
    ? await prisma.monthlyClose.update({
        where: { id: existing.id },
        data: { ...data, notas, cargadoPorId: session.userId },
      })
    : await prisma.monthlyClose.create({
        data: { monthId, localId, ...data, notas, cargadoPorId: session.userId },
      });

  return NextResponse.json(close);
}
