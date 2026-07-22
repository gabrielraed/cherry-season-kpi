import { NextResponse } from "next/server";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { getWeekById, getWeeklyEntriesForWeek } from "@/lib/data";
import { computeWeeklyKpis, sumWeeklyTotals, type WeeklyTotals } from "@/lib/kpi";
import { formatWeekLabel } from "@/lib/weeks";

export async function GET(_req: Request, { params }: { params: Promise<{ weekId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { weekId } = await params;
  const [week, accessIds] = await Promise.all([getWeekById(weekId), accessibleLocalIds(session)]);
  if (!week) return NextResponse.json({ error: "Semana no encontrada." }, { status: 404 });

  const entries = await getWeeklyEntriesForWeek(weekId, accessIds);
  const totals = sumWeeklyTotals(entries as WeeklyTotals[]);
  const kpis = computeWeeklyKpis(totals);

  return NextResponse.json({
    id: week.id,
    label: formatWeekLabel(week.isoYear, week.isoWeek),
    hasData: entries.length > 0,
    kpis,
  });
}
