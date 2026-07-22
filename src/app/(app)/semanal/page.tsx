import { getSession, accessibleLocalIds } from "@/lib/auth";
import { listWeeks } from "@/lib/data";
import { Card, CardBody } from "@/components/ui/card";
import { NuevaSemanaButton } from "@/components/nueva-semana-button";
import { WeekListRow } from "@/components/week-list-row";

export default async function SemanalListPage() {
  const session = await getSession();
  const accessIds = session ? await accessibleLocalIds(session) : null;
  const weeks = await listWeeks(accessIds, 26);
  const isAdmin = session?.rol === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Histórico semanal</h1>
          <p className="text-sm text-ink-secondary">Cierre económico y financiero por semana.</p>
        </div>
        {isAdmin && <NuevaSemanaButton />}
      </div>

      <div className="space-y-2">
        {weeks.map((w) => (
          <WeekListRow
            key={w.id}
            id={w.id}
            label={w.label}
            hasData={w.hasData}
            ventas={w.ventas}
            semaforo={w.semaforo}
            isAdmin={isAdmin}
          />
        ))}
        {weeks.length === 0 && (
          <Card>
            <CardBody>Todavía no hay semanas cargadas.</CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
