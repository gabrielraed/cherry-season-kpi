import { notFound } from "next/navigation";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { getWeekById, getLocales, getGoalsMap, getWeeklyEntriesForWeek } from "@/lib/data";
import { computeWeeklyKpis, sumWeeklyTotals, evaluateSemaforo, kpiDef, type WeeklyTotals } from "@/lib/kpi";
import { formatWeekLabel } from "@/lib/weeks";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyEntryForm } from "@/components/weekly-entry-form";

const KPI_ORDER = [
  "rentabilidad_pct",
  "margen_bruto_pct",
  "costo_laboral_pct",
  "gasto_estructura_pct",
  "comisiones_apps_pct",
  "marketing_pct",
  "descartes_pct",
  "vajilla_pct",
] as const;

export default async function SemanaDetailPage({
  params,
}: {
  params: Promise<{ weekId: string }>;
}) {
  const { weekId } = await params;
  const session = await getSession();
  const accessIds = session ? await accessibleLocalIds(session) : null;

  const [week, locales, goals, entries] = await Promise.all([
    getWeekById(weekId),
    getLocales(accessIds),
    getGoalsMap(),
    getWeeklyEntriesForWeek(weekId, accessIds),
  ]);

  if (!week) notFound();

  const totals = sumWeeklyTotals(entries as WeeklyTotals[]);
  const kpis = computeWeeklyKpis(totals);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{formatWeekLabel(week.isoYear, week.isoWeek)}</h1>
        <p className="text-sm text-ink-secondary">Cierre económico y financiero consolidado.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          label="Ventas"
          value={kpis.ventas}
          unit="currency"
          formula={kpiDef("ventas").formula}
          className="col-span-2 sm:col-span-1"
        />
        {KPI_ORDER.map((code) => {
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
        <KpiCard label="Tickets" value={kpis.cantidadTickets} unit="number" />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-secondary">Carga por local</h2>
        {locales.map((local) => {
          const entry = entries.find((e) => e.localId === local.id);
          return (
            <Card key={local.id}>
              <CardHeader>
                <CardTitle>{local.nombre}</CardTitle>
              </CardHeader>
              <CardBody>
                <WeeklyEntryForm
                  weekId={week.id}
                  localId={local.id}
                  localNombre={local.nombre}
                  initial={
                    entry
                      ? {
                          ventas: entry.ventas,
                          costoInsumos: entry.costoInsumos,
                          costoLaboral: entry.costoLaboral,
                          gastoEstructura: entry.gastoEstructura,
                          comisionesApps: entry.comisionesApps,
                          marketing: entry.marketing,
                          descartes: entry.descartes,
                          vajilla: entry.vajilla,
                          cantidadTickets: entry.cantidadTickets,
                          ingresoCaja: entry.ingresoCaja,
                          egresoCaja: entry.egresoCaja,
                          notas: entry.notas ?? "",
                        }
                      : undefined
                  }
                />
              </CardBody>
            </Card>
          );
        })}
        {locales.length === 0 && (
          <Card>
            <CardBody>No tenés locales asignados.</CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
