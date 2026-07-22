import { NextResponse } from "next/server";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { getMonthDetail, getMonthCalendarRollup } from "@/lib/data";
import { formatMonthLabel } from "@/lib/weeks";

export async function GET(_req: Request, { params }: { params: Promise<{ monthId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { monthId } = await params;
  const month = await getMonthDetail(monthId);
  if (!month) return NextResponse.json({ error: "Mes no encontrado." }, { status: 404 });

  const accessIds = await accessibleLocalIds(session);
  const rollup = await getMonthCalendarRollup(month.year, month.month, accessIds);
  const close = month.closes.find((c) => c.localId === null);
  const flujoCajaNeto = close
    ? close.flujoCajaOperativo + close.flujoCajaInversion + close.flujoCajaFinanciacion
    : 0;

  return NextResponse.json({
    id: month.id,
    label: formatMonthLabel(month.year, month.month),
    hasClose: Boolean(close),
    kpis: {
      ventas_mes: rollup.totalVentas,
      cantidad_tickets: rollup.totalTickets,
      flujo_caja_neto: flujoCajaNeto,
      ebitda: close?.ebitda ?? 0,
      resultado_neto_consolidado: close?.resultadoNetoConsolidado ?? 0,
    },
  });
}
