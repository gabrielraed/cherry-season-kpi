import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { getMonthDetail, getGoalsMap, getLocales, getMonthCalendarRollup } from "@/lib/data";
import { evaluateSemaforo, kpiDef, formatKpiValue } from "@/lib/kpi";
import { formatMonthLabel } from "@/lib/weeks";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyCloseForm } from "@/components/monthly-close-form";

export default async function MesDetailPage({
  params,
}: {
  params: Promise<{ monthId: string }>;
}) {
  const { monthId } = await params;
  const session = await getSession();
  const accessIds = session ? await accessibleLocalIds(session) : null;
  const [month, goals, locales] = await Promise.all([
    getMonthDetail(monthId),
    getGoalsMap(),
    getLocales(accessIds),
  ]);

  if (!month) notFound();

  const rollup = await getMonthCalendarRollup(month.year, month.month, accessIds);
  const close = month.closes.find((c) => c.localId === null);
  const flujoCajaNeto = close
    ? close.flujoCajaOperativo + close.flujoCajaInversion + close.flujoCajaFinanciacion
    : 0;

  const monthlyKpis = [
    { code: "ventas_mes", value: rollup.totalVentas },
    { code: "cantidad_tickets", value: rollup.totalTickets },
    { code: "flujo_caja_neto", value: flujoCajaNeto },
    { code: "ebitda", value: close?.ebitda ?? 0 },
    { code: "resultado_neto_consolidado", value: close?.resultadoNetoConsolidado ?? 0 },
  ] as const;

  const closeValues = (c: (typeof month.closes)[number]) => ({
    ebitda: c.ebitda,
    resultadoOperativo: c.resultadoOperativo,
    resultadoNetoConsolidado: c.resultadoNetoConsolidado,
    flujoCajaOperativo: c.flujoCajaOperativo,
    flujoCajaInversion: c.flujoCajaInversion,
    flujoCajaFinanciacion: c.flujoCajaFinanciacion,
    saldoCajaInicial: c.saldoCajaInicial,
    saldoCajaFinal: c.saldoCajaFinal,
    notas: c.notas ?? "",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold capitalize">{formatMonthLabel(month.year, month.month)}</h1>
        <p className="text-sm text-ink-secondary">
          KPIs del mes calendario (día 1 al último día) y cierre financiero consolidado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {monthlyKpis.map(({ code, value }) => {
          const def = kpiDef(code);
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semanas que aportan a este mes</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-4 py-2 font-medium">Semana</th>
                <th className="px-4 py-2 font-medium">Días en este mes</th>
                <th className="px-4 py-2 font-medium">Ventas prorateadas</th>
                <th className="px-4 py-2 font-medium">Tickets prorateados</th>
              </tr>
            </thead>
            <tbody>
              {rollup.weeks.map((w) => (
                <tr key={w.weekId} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/semanal/${w.weekId}`} className="font-medium text-brand-strong hover:underline">
                      {w.label}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{w.daysInMonth} / 7</td>
                  <td className="px-4 py-2.5 tabular-nums">{formatKpiValue(w.ventas, "currency")}</td>
                  <td className="px-4 py-2.5 tabular-nums">{Math.round(w.tickets).toLocaleString("es-AR")}</td>
                </tr>
              ))}
              {rollup.weeks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-ink-muted">
                    Todavía no hay semanas cargadas para este mes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
        <CardBody className="border-t border-border text-xs text-ink-muted">
          Cuando una semana cruza de un mes a otro, se le asigna a cada mes solo la proporción de
          sus 7 días que realmente caen en ese mes calendario — por eso la misma semana puede
          aparecer (parcialmente) en dos meses distintos.
        </CardBody>
      </Card>

      {session?.rol === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Cierre financiero y económico del mes (consolidado)</CardTitle>
          </CardHeader>
          <CardBody>
            <MonthlyCloseForm
              monthId={month.id}
              localId={null}
              initial={close ? closeValues(close) : undefined}
            />
          </CardBody>
        </Card>
      ) : (
        !close && (
          <Card>
            <CardBody className="text-sm text-ink-muted">
              La gerencia todavía no cargó el cierre financiero consolidado de este mes.
            </CardBody>
          </Card>
        )
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink-secondary">Carga por local</h2>
        {locales.map((local) => {
          const localClose = month.closes.find((c) => c.localId === local.id);
          return (
            <Card key={local.id}>
              <CardHeader>
                <CardTitle>{local.nombre}</CardTitle>
              </CardHeader>
              <CardBody>
                <MonthlyCloseForm
                  monthId={month.id}
                  localId={local.id}
                  initial={localClose ? closeValues(localClose) : undefined}
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
