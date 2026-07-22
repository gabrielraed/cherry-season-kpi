import { Card } from "@/components/ui/card";
import { SemaforoBadge } from "@/components/ui/semaforo-badge";
import { formatKpiValue, type GoalLike, type KpiUnit, type Semaforo } from "@/lib/kpi";
import { cn } from "@/lib/cn";

const SEMAFORO_META_COLOR: Record<Semaforo, string> = {
  verde: "var(--status-good)",
  amarillo: "#8a6200",
  rojo: "var(--status-critical)",
  sin_meta: "var(--ink-muted)",
};

export function KpiCard({
  label,
  value,
  unit,
  semaforo,
  goal,
  descripcion,
  formula,
  className,
}: {
  label: string;
  value: number;
  unit: KpiUnit;
  semaforo?: Semaforo;
  goal?: GoalLike;
  descripcion?: string;
  formula?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5", className)} title={descripcion}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-secondary">{label}</p>
        {semaforo && <SemaforoBadge estado={semaforo} />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-primary sm:text-[26px]">
        {formatKpiValue(value, unit)}
      </p>
      {goal && semaforo && semaforo !== "sin_meta" && (
        <p
          className="mt-0.5 text-xs font-semibold tabular-nums"
          style={{ color: SEMAFORO_META_COLOR[semaforo] }}
        >
          Meta {goal.higherIsBetter ? "≥" : "≤"} {formatKpiValue(goal.verdeThreshold, unit)}
        </p>
      )}
      {formula && <p className="mt-1 text-[11px] leading-snug text-ink-muted">{formula}</p>}
    </Card>
  );
}
