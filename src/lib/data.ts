import { prisma } from "@/lib/db";
import {
  computeWeeklyKpis,
  sumWeeklyTotals,
  evaluateSemaforo,
  type WeeklyTotals,
  type GoalLike,
} from "@/lib/kpi";
import {
  formatWeekLabel,
  formatMonthLabel,
  isoWeekToMonth,
  isoWeekInfo,
  weekBounds,
  monthDateRange,
  overlapDays,
} from "@/lib/weeks";

export async function getLocales(accessibleLocalIds: string[] | null) {
  return prisma.local.findMany({
    where: {
      activo: true,
      ...(accessibleLocalIds ? { id: { in: accessibleLocalIds } } : {}),
    },
    orderBy: { orden: "asc" },
  });
}

/** Metas consolidadas indexadas por kpiCode (el scope por-local se puede sumar después si hace falta). */
export async function getGoalsMap(): Promise<Map<string, GoalLike>> {
  const goals = await prisma.kpiGoal.findMany({ where: { localId: null } });
  return new Map(
    goals.map((g) => [
      g.kpiCode,
      { higherIsBetter: g.higherIsBetter, verdeThreshold: g.verdeThreshold, amarilloThreshold: g.amarilloThreshold },
    ])
  );
}

export interface WeekListItem {
  id: string;
  isoYear: number;
  isoWeek: number;
  label: string;
  startDate: Date;
  endDate: Date;
  hasData: boolean;
  ventas: number;
  rentabilidadPct: number;
  semaforo: ReturnType<typeof evaluateSemaforo>;
}

export async function listWeeks(
  accessibleLocalIds: string[] | null,
  take = 26,
  onlyLocalId?: string
): Promise<WeekListItem[]> {
  const goals = await getGoalsMap();
  const localFilter = onlyLocalId
    ? { localId: onlyLocalId }
    : accessibleLocalIds
      ? { localId: { in: accessibleLocalIds } }
      : {};
  const weeks = await prisma.week.findMany({
    orderBy: [{ isoYear: "desc" }, { isoWeek: "desc" }],
    take,
    include: {
      entries: { where: localFilter },
    },
  });

  return weeks.map((w) => {
    const totals = sumWeeklyTotals(w.entries as WeeklyTotals[]);
    const kpis = computeWeeklyKpis(totals);
    return {
      id: w.id,
      isoYear: w.isoYear,
      isoWeek: w.isoWeek,
      label: formatWeekLabel(w.isoYear, w.isoWeek),
      startDate: w.startDate,
      endDate: w.endDate,
      hasData: w.entries.length > 0,
      ventas: kpis.ventas,
      rentabilidadPct: kpis.rentabilidad_pct,
      semaforo: evaluateSemaforo(kpis.rentabilidad_pct, goals.get("rentabilidad_pct")),
    };
  });
}

export async function getWeekById(weekId: string) {
  return prisma.week.findUnique({ where: { id: weekId } });
}

export async function getLatestWeek() {
  return prisma.week.findFirst({ orderBy: [{ isoYear: "desc" }, { isoWeek: "desc" }] });
}

/** Última semana que tiene al menos un local con datos cargados (a diferencia de getLatestWeek,
 * que trae la última fila del catálogo aunque esté vacía). */
export async function getLatestWeekWithData() {
  return prisma.week.findFirst({
    where: { entries: { some: {} } },
    orderBy: [{ isoYear: "desc" }, { isoWeek: "desc" }],
  });
}

export async function getWeeklyEntriesForWeek(weekId: string, accessibleLocalIds: string[] | null) {
  return prisma.weeklyEntry.findMany({
    where: {
      weekId,
      ...(accessibleLocalIds ? { localId: { in: accessibleLocalIds } } : {}),
    },
  });
}

export interface MonthListItem {
  id: string;
  year: number;
  month: number;
  label: string;
  hasClose: boolean;
  cantidadTickets: number;
  ebitda: number;
}

export async function listMonths(
  take = 12,
  accessibleLocalIds: string[] | null = null
): Promise<MonthListItem[]> {
  const months = await prisma.month.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take,
    include: { closes: true },
  });

  return Promise.all(
    months.map(async (m) => {
      const rollup = await getMonthCalendarRollup(m.year, m.month, accessibleLocalIds);
      const consolidado = m.closes.find((c) => c.localId === null);
      return {
        id: m.id,
        year: m.year,
        month: m.month,
        label: formatMonthLabel(m.year, m.month),
        hasClose: Boolean(consolidado),
        cantidadTickets: rollup.totalTickets,
        ebitda: consolidado?.ebitda ?? 0,
      };
    })
  );
}

export async function getMonthDetail(monthId: string) {
  return prisma.month.findUnique({
    where: { id: monthId },
    include: {
      closes: { include: { local: true } },
    },
  });
}

export interface MonthWeekRow {
  weekId: string;
  isoYear: number;
  isoWeek: number;
  label: string;
  daysInMonth: number;
  ventas: number; // prorateado por los días de esa semana que caen en el mes calendario
  tickets: number; // ídem
}

export interface MonthCalendarRollup {
  year: number;
  month: number;
  weeks: MonthWeekRow[];
  totalVentas: number;
  totalTickets: number;
}

/**
 * Cierre mensual "profesional": el mes real de la empresa va del día 1 al último día del
 * calendario, pero las semanas ISO casi nunca calzan justo con esos bordes. En vez de asignar
 * cada semana entera a un solo mes (lo que sub/sobre-cuenta los días que quedan del otro lado),
 * cada semana que se superpone con el mes aporta solo la fracción de sus 7 días que realmente
 * caen en ese mes calendario. Es el criterio estándar para reconciliar un cierre semanal con un
 * cierre mensual exacto sin tener que recolectar datos día por día.
 */
export async function getMonthCalendarRollup(
  year: number,
  month: number,
  accessibleLocalIds: string[] | null
): Promise<MonthCalendarRollup> {
  const { start, end } = monthDateRange(year, month);
  const localFilter = accessibleLocalIds ? { localId: { in: accessibleLocalIds } } : {};

  const weeksRaw = await prisma.week.findMany({
    where: { startDate: { lte: end }, endDate: { gte: start } },
    orderBy: [{ isoYear: "asc" }, { isoWeek: "asc" }],
    include: { entries: { where: localFilter } },
  });

  const weeks: MonthWeekRow[] = weeksRaw.map((w) => {
    const daysInMonth = overlapDays(w.startDate, start, end);
    const totals = sumWeeklyTotals(w.entries as WeeklyTotals[]);
    const factor = daysInMonth / 7;
    return {
      weekId: w.id,
      isoYear: w.isoYear,
      isoWeek: w.isoWeek,
      label: formatWeekLabel(w.isoYear, w.isoWeek),
      daysInMonth,
      ventas: totals.ventas * factor,
      tickets: totals.cantidadTickets * factor,
    };
  });

  return {
    year,
    month,
    weeks,
    totalVentas: weeks.reduce((acc, w) => acc + w.ventas, 0),
    totalTickets: Math.round(weeks.reduce((acc, w) => acc + w.tickets, 0)),
  };
}

export async function getLatestMonth() {
  return prisma.month.findFirst({ orderBy: [{ year: "desc" }, { month: "desc" }] });
}

/** Devuelve (creando si hace falta) la semana ISO y el mes a los que pertenece una fecha dada. */
export async function ensureWeekForDate(date: Date) {
  const { isoYear, isoWeek } = isoWeekInfo(date);
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

/** Crea (o devuelve, si ya existe) la semana ISO siguiente a la última que tiene datos cargados. */
export async function createNextWeek() {
  const last = await getLatestWeekWithData();
  const nextMonday = last ? new Date(last.startDate) : new Date();
  if (last) nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  return ensureWeekForDate(nextMonday);
}
