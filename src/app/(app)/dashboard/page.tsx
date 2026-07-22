import Link from "next/link";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import {
  getLocales,
  getGoalsMap,
  getLatestWeek,
  getWeekById,
  getWeeklyEntriesForWeek,
  listWeeks,
  getMonthDetail,
  listMonths,
} from "@/lib/data";
import { computeWeeklyKpis, sumWeeklyTotals, evaluateSemaforo, kpiDef, type WeeklyTotals } from "@/lib/kpi";
import { KpiCard } from "@/components/kpi-card";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { SemaforoBadge } from "@/components/ui/semaforo-badge";
import { formatKpiValue } from "@/lib/kpi";
import { formatMonthLabel } from "@/lib/weeks";
import { WeekCompare } from "@/components/week-compare";
import { MonthCompare } from "@/components/month-compare";
import { LocalFilter } from "@/components/local-filter";
import { WeekPicker } from "@/components/week-picker";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ local?: string; week?: string }>;
}) {
  const session = await getSession();
  const accessIds = session ? await accessibleLocalIds(session) : null;
  const { local: localParam, week: weekParam } = await searchParams;

  const locales = await getLocales(accessIds);
  const selectedLocal = localParam ? locales.find((l) => l.id === localParam) ?? null : null;
  const selectedLocalId = selectedLocal?.id;

  const latestWeek = await getLatestWeek();
  const currentWeek = weekParam ? await getWeekById(weekParam) : latestWeek;

  if (!currentWeek) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Tablero</h1>
        <Card>
          <CardBody>Todavía no hay semanas cargadas.</CardBody>
        </Card>
      </div>
    );
  }

  const [goals, weeksHistory, allWeeks, allMonths, monthDetail] = await Promise.all([
    getGoalsMap(),
    listWeeks(accessIds, 8, selectedLocalId),
    listWeeks(accessIds, 52),
    listMonths(24, accessIds),
    getMonthDetail(currentWeek.monthId),
  ]);

  const entries = await getWeeklyEntriesForWeek(currentWeek.id, accessIds);
  const filteredEntries = selectedLocalId ? entries.filter((e) => e.localId === selectedLocalId) : entries;
  const totals = sumWeeklyTotals(filteredEntries as WeeklyTotals[]);
  const kpis = computeWeeklyKpis(totals);

  const monthlyClose = monthDetail?.closes.find((c) => c.localId === (selectedLocalId ?? null));

  const perLocal = locales.map((local) => {
    const entry = entries.find((e) => e.localId === local.id);
    const t: WeeklyTotals = entry ?? {
      ventas: 0,
      costoInsumos: 0,
      costoLaboral: 0,
      gastoEstructura: 0,
      comisionesApps: 0,
      marketing: 0,
      descartes: 0,
      vajilla: 0,
      cantidadTickets: 0,
      ingresoCaja: 0,
      egresoCaja: 0,
    };
    const k = computeWeeklyKpis(t);
    return {
      local,
      k,
      hasData: Boolean(entry),
      semaforo: evaluateSemaforo(k.rentabilidad_pct, goals.get("rentabilidad_pct")),
    };
  });

  const trendData = weeksHistory
    .slice()
    .reverse()
    .map((w) => ({ label: `S${w.isoWeek}`, ventas: Math.round(w.ventas) }));

  const semanaKpis = [
    "rentabilidad_pct",
    "margen_bruto_pct",
    "costo_laboral_pct",
    "gasto_estructura_pct",
    "comisiones_apps_pct",
    "marketing_pct",
    "descartes_pct",
    "vajilla_pct",
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {selectedLocal ? selectedLocal.nombre : "Tablero consolidado"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeekPicker
            weeks={allWeeks.map((w) => ({ id: w.id, label: w.label }))}
            selected={currentWeek.id}
          />
          <LocalFilter
            locales={locales.map((l) => ({ id: l.id, nombre: l.nombre }))}
            selected={selectedLocal?.id ?? "all"}
          />
          <ButtonLink href={`/semanal/${currentWeek.id}`} variant="secondary" size="sm">
            Cargar semana
          </ButtonLink>
          {monthDetail && (
            <ButtonLink href={`/mensual/${monthDetail.id}`} variant="secondary" size="sm">
              Cierre mensual
            </ButtonLink>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          label="Ventas de la semana"
          value={kpis.ventas}
          unit="currency"
          formula={kpiDef("ventas").formula}
          className="col-span-2 sm:col-span-1"
        />
        {semanaKpis.map((code) => {
          const def = kpiDef(code);
          const value = kpis[code as keyof typeof kpis] as number;
          return (
            <KpiCard
              key={code}
              label={def.label}
              value={value}
              unit={def.unit}
              descripcion={def.descripcion}
              formula={def.formula}
              goal={goals.get(code)}
              semaforo={evaluateSemaforo(value, goals.get(code))}
            />
          );
        })}
        <KpiCard
          label="Ticket promedio"
          value={kpis.ticket_promedio}
          unit="currency"
          formula={kpiDef("ticket_promedio").formula}
        />
      </div>

      {monthlyClose && monthDetail && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-secondary">
            Cierre mensual · {formatMonthLabel(monthDetail.year, monthDetail.month)}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              label="EBITDA / resultado operativo"
              value={monthlyClose.ebitda}
              unit="currency"
              formula={kpiDef("ebitda").formula}
              goal={goals.get("ebitda")}
              semaforo={evaluateSemaforo(monthlyClose.ebitda, goals.get("ebitda"))}
            />
            <KpiCard
              label="Resultado neto consolidado"
              value={monthlyClose.resultadoNetoConsolidado}
              unit="currency"
              formula={kpiDef("resultado_neto_consolidado").formula}
              goal={goals.get("resultado_neto_consolidado")}
              semaforo={evaluateSemaforo(
                monthlyClose.resultadoNetoConsolidado,
                goals.get("resultado_neto_consolidado")
              )}
            />
            <KpiCard
              label="Flujo de caja"
              value={
                monthlyClose.flujoCajaOperativo +
                monthlyClose.flujoCajaInversion +
                monthlyClose.flujoCajaFinanciacion
              }
              unit="currency"
              formula={kpiDef("flujo_caja_neto").formula}
              goal={goals.get("flujo_caja_neto")}
            />
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ventas — últimas {trendData.length} semanas</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendChart data={trendData} series={[{ key: "ventas", label: "Ventas" }]} unit="currency" />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeekCompare weeks={allWeeks.map((w) => ({ id: w.id, label: w.label }))} />
        <MonthCompare months={allMonths.map((m) => ({ id: m.id, label: m.label }))} />
      </div>

      {!selectedLocal && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación por local — semana seleccionada</CardTitle>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="px-4 py-2 font-medium">Local</th>
                  <th className="px-4 py-2 font-medium">Ventas</th>
                  <th className="px-4 py-2 font-medium">Rentabilidad</th>
                  <th className="px-4 py-2 font-medium">Ticket prom.</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {perLocal.map(({ local, k, hasData, semaforo }) => (
                  <tr key={local.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">{local.nombre}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatKpiValue(k.ventas, "currency")}</td>
                    <td className="px-4 py-2.5 tabular-nums">{k.rentabilidad_pct.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatKpiValue(k.ticket_promedio, "currency")}
                    </td>
                    <td className="px-4 py-2.5">
                      {hasData ? (
                        <SemaforoBadge estado={semaforo} />
                      ) : (
                        <span className="text-xs text-ink-muted">Sin carga</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <p className="text-center text-xs text-ink-muted">
        <Link href="/semanal" className="underline">
          Ver histórico completo de semanas
        </Link>
      </p>
    </div>
  );
}
