import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { ensureWeekForDate } from "@/lib/data";
import { parseWeeklyImportFile } from "@/lib/import";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Adjuntá un archivo .xlsx o .csv." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const { rows, errors } = parseWeeklyImportFile(buffer);

  const allowedIds = await accessibleLocalIds(session);
  const locales = await prisma.local.findMany({
    where: allowedIds ? { id: { in: allowedIds } } : {},
  });
  const localByName = new Map(locales.map((l) => [l.nombre.trim().toLowerCase(), l]));

  let creados = 0;
  let actualizados = 0;
  const rowErrors = [...errors];

  for (const row of rows) {
    const local = localByName.get(row.localNombre.trim().toLowerCase());
    if (!local) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: `Local desconocido o sin acceso: "${row.localNombre}".`,
      });
      continue;
    }

    const week = await ensureWeekForDate(row.fecha);
    const existing = await prisma.weeklyEntry.findUnique({
      where: { weekId_localId: { weekId: week.id, localId: local.id } },
    });

    await prisma.weeklyEntry.upsert({
      where: { weekId_localId: { weekId: week.id, localId: local.id } },
      update: {
        ventas: row.ventas,
        costoInsumos: row.costoInsumos,
        costoLaboral: row.costoLaboral,
        gastoEstructura: row.gastoEstructura,
        comisionesApps: row.comisionesApps,
        marketing: row.marketing,
        descartes: row.descartes,
        vajilla: row.vajilla,
        cantidadTickets: row.cantidadTickets,
        ingresoCaja: row.ingresoCaja,
        egresoCaja: row.egresoCaja,
        notas: row.notas || null,
        origen: "import",
        cargadoPorId: session.userId,
      },
      create: {
        weekId: week.id,
        localId: local.id,
        ventas: row.ventas,
        costoInsumos: row.costoInsumos,
        costoLaboral: row.costoLaboral,
        gastoEstructura: row.gastoEstructura,
        comisionesApps: row.comisionesApps,
        marketing: row.marketing,
        descartes: row.descartes,
        vajilla: row.vajilla,
        cantidadTickets: row.cantidadTickets,
        ingresoCaja: row.ingresoCaja,
        egresoCaja: row.egresoCaja,
        notas: row.notas || null,
        origen: "import",
        cargadoPorId: session.userId,
      },
    });

    if (existing) actualizados++;
    else creados++;
  }

  return NextResponse.json({
    filasProcesadas: rows.length,
    creados,
    actualizados,
    errores: rowErrors,
  });
}
