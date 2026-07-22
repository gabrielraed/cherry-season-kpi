import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { isoWeekInfo, weekBounds, isoWeekToMonth } from "../src/lib/weeks";
import { KPI_CATALOG } from "../src/lib/kpi";

const prisma = new PrismaClient();

async function ensureWeek(isoYear: number, isoWeek: number) {
  const existing = await prisma.week.findUnique({ where: { isoYear_isoWeek: { isoYear, isoWeek } } });
  if (existing) return existing;

  const { year, month } = isoWeekToMonth(isoYear, isoWeek);
  const monthRow = await prisma.month.upsert({
    where: { year_month: { year, month } },
    update: {},
    create: { year, month },
  });
  const { startDate, endDate } = weekBounds(isoYear, isoWeek);
  return prisma.week.create({
    data: { isoYear, isoWeek, startDate, endDate, monthId: monthRow.id },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cafeteria.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "cafeteria2026";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      nombre: "Gerencia",
      rol: "ADMIN",
    },
  });

  const localesData = [
    { nombre: "Local Centro", orden: 1 },
    { nombre: "Local Norte", orden: 2 },
    { nombre: "Tostaduría / Producción", orden: 3 },
  ];

  const locales = [];
  for (const l of localesData) {
    const existing = await prisma.local.findFirst({ where: { nombre: l.nombre } });
    locales.push(
      existing ?? (await prisma.local.create({ data: { nombre: l.nombre, orden: l.orden } }))
    );
  }

  // Metas por defecto (consolidado) para cada KPI del catálogo.
  // Nota: localId es NULL a nivel consolidado; SQLite no compara NULLs como iguales dentro
  // de un índice único, así que la unicidad para el caso consolidado se garantiza acá
  // (findFirst + create/update) en vez de depender del @@unique del schema.
  for (const kpi of KPI_CATALOG) {
    if (kpi.unit === "currency" && kpi.defaultVerde === 0 && kpi.defaultAmarillo === 0) continue;
    const existing = await prisma.kpiGoal.findFirst({
      where: { kpiCode: kpi.code, localId: null },
    });
    if (!existing) {
      await prisma.kpiGoal.create({
        data: {
          kpiCode: kpi.code,
          scope: "consolidado",
          localId: null,
          higherIsBetter: kpi.higherIsBetter,
          verdeThreshold: kpi.defaultVerde,
          amarilloThreshold: kpi.defaultAmarillo,
        },
      });
    }
  }

  // Responsables por defecto (gerencia) para cada KPI: confección (carga el dato) y
  // cumplimiento (responde por el resultado), frecuencia según categoría.
  for (const kpi of KPI_CATALOG) {
    for (const tipo of ["confeccion", "cumplimiento"] as const) {
      const existing = await prisma.kpiResponsible.findFirst({
        where: { kpiCode: kpi.code, localId: null, tipo },
      });
      if (!existing) {
        await prisma.kpiResponsible.create({
          data: {
            kpiCode: kpi.code,
            localId: null,
            tipo,
            userId: admin.id,
            frecuencia: kpi.category,
          },
        });
      }
    }
  }

  // Catálogo de semanas: últimas 10 semanas hasta hoy, para navegar histórico desde el arranque.
  const today = new Date();
  const { isoYear: currentIsoYear, isoWeek: currentIsoWeek } = isoWeekInfo(today);
  const weeks = [];
  for (let i = 9; i >= 0; i--) {
    let y = currentIsoYear;
    let w = currentIsoWeek - i;
    while (w < 1) {
      y -= 1;
      w += 52;
    }
    weeks.push(await ensureWeek(y, w));
  }

  // Cargar datos de ejemplo en las últimas 4 semanas para las 2 primeras sucursales (no la tostaduría).
  const sampleWeeks = weeks.slice(-4);
  const baseByLocal: Record<string, number> = {
    [locales[0].id]: 1_450_000,
    [locales[1].id]: 980_000,
  };

  for (const [idx, week] of sampleWeeks.entries()) {
    for (const local of [locales[0], locales[1]]) {
      const base = baseByLocal[local.id];
      const variacion = 1 + (idx - 1.5) * 0.03;
      const ventas = Math.round(base * variacion);
      await prisma.weeklyEntry.upsert({
        where: { weekId_localId: { weekId: week.id, localId: local.id } },
        update: {},
        create: {
          weekId: week.id,
          localId: local.id,
          ventas,
          costoInsumos: Math.round(ventas * 0.32),
          costoLaboral: Math.round(ventas * 0.29),
          gastoEstructura: Math.round(ventas * 0.16),
          comisionesApps: Math.round(ventas * 0.07),
          marketing: Math.round(ventas * 0.03),
          descartes: Math.round(ventas * 0.02),
          vajilla: Math.round(ventas * 0.01),
          cantidadTickets: Math.round(ventas / 4200),
          ingresoCaja: ventas,
          egresoCaja: Math.round(ventas * 0.85),
          origen: "manual",
          cargadoPorId: admin.id,
        },
      });
    }
  }

  // Cierre financiero/económico del mes anterior completo, como ejemplo de histórico mensual.
  const prevMonthWeek = weeks[0];
  const monthRow = await prisma.month.findUnique({ where: { id: prevMonthWeek.monthId } });
  if (monthRow) {
    const existingClose = await prisma.monthlyClose.findFirst({
      where: { monthId: monthRow.id, localId: null },
    });
    if (!existingClose) {
      await prisma.monthlyClose.create({
        data: {
          monthId: monthRow.id,
          localId: null,
          ebitda: 620_000,
          resultadoOperativo: 540_000,
          resultadoNetoConsolidado: 410_000,
          flujoCajaOperativo: 480_000,
          flujoCajaInversion: -90_000,
          flujoCajaFinanciacion: -60_000,
          saldoCajaInicial: 1_200_000,
          saldoCajaFinal: 1_530_000,
          cargadoPorId: admin.id,
        },
      });
    }
  }

  console.log("Seed completo.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
