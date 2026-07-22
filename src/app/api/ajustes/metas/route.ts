import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (session.rol !== "ADMIN") {
    return { error: NextResponse.json({ error: "Solo la gerencia puede editar metas." }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const kpiCode = typeof body?.kpiCode === "string" ? body.kpiCode : null;
  const localId: string | null = typeof body?.localId === "string" ? body.localId : null;
  if (!kpiCode) return NextResponse.json({ error: "Falta el KPI." }, { status: 400 });

  if (body?.kind === "responsible") {
    const userId = typeof body?.userId === "string" ? body.userId : null;
    const frecuencia = typeof body?.frecuencia === "string" ? body.frecuencia : "semanal";
    const tipo = body?.tipo === "confeccion" ? "confeccion" : "cumplimiento";
    if (!userId) return NextResponse.json({ error: "Falta el responsable." }, { status: 400 });

    // localId nullable => SQLite no lo trata como igual dentro del índice único, se resuelve a mano.
    const existing = await prisma.kpiResponsible.findFirst({ where: { kpiCode, localId, tipo } });
    const saved = existing
      ? await prisma.kpiResponsible.update({ where: { id: existing.id }, data: { userId, frecuencia } })
      : await prisma.kpiResponsible.create({ data: { kpiCode, localId, tipo, userId, frecuencia } });
    return NextResponse.json(saved);
  }

  const higherIsBetter = Boolean(body?.higherIsBetter);
  const verdeThreshold = Number(body?.verdeThreshold);
  const amarilloThreshold = Number(body?.amarilloThreshold);
  if (!Number.isFinite(verdeThreshold) || !Number.isFinite(amarilloThreshold)) {
    return NextResponse.json({ error: "Las metas deben ser números." }, { status: 400 });
  }

  const existing = await prisma.kpiGoal.findFirst({ where: { kpiCode, localId } });
  const saved = existing
    ? await prisma.kpiGoal.update({
        where: { id: existing.id },
        data: { higherIsBetter, verdeThreshold, amarilloThreshold },
      })
    : await prisma.kpiGoal.create({
        data: {
          kpiCode,
          localId,
          scope: localId ? "local" : "consolidado",
          higherIsBetter,
          verdeThreshold,
          amarilloThreshold,
        },
      });
  return NextResponse.json(saved);
}
