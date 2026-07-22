import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildTemplateWorkbook } from "@/lib/import";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const locales = await prisma.local.findMany({ where: { activo: true }, orderBy: { orden: "asc" } });
  const buffer = buildTemplateWorkbook(locales.map((l) => l.nombre));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-carga-semanal.xlsx"',
    },
  });
}
