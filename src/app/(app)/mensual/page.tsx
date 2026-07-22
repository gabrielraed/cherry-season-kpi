import Link from "next/link";
import { listMonths } from "@/lib/data";
import { getSession, accessibleLocalIds } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/card";
import { formatKpiValue } from "@/lib/kpi";

export default async function MensualListPage() {
  const session = await getSession();
  const accessIds = session ? await accessibleLocalIds(session) : null;
  const months = await listMonths(12, accessIds);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Histórico mensual</h1>
        <p className="text-sm text-ink-secondary">Cierre económico y financiero consolidado del mes.</p>
      </div>

      <div className="space-y-2">
        {months.map((m) => (
          <Link key={m.id} href={`/mensual/${m.id}`}>
            <Card className="flex items-center justify-between gap-3 p-4 capitalize transition-colors hover:bg-brand-tint/40">
              <div>
                <p className="font-medium text-ink-primary">{m.label}</p>
                <p className="text-xs text-ink-muted normal-case">
                  {m.cantidadTickets.toLocaleString("es-AR")} tickets
                </p>
              </div>
              {m.hasClose ? (
                <span className="text-sm font-medium tabular-nums text-ink-primary">
                  {formatKpiValue(m.ebitda, "currency")}
                </span>
              ) : (
                <span className="text-xs text-ink-muted normal-case">Cierre pendiente</span>
              )}
            </Card>
          </Link>
        ))}
        {months.length === 0 && (
          <Card>
            <CardBody>Todavía no hay meses con semanas cargadas.</CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
