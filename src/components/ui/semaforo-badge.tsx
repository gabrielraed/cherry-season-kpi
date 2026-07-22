import { cn } from "@/lib/cn";
import type { Semaforo } from "@/lib/kpi";
import { Check, TriangleAlert, CircleAlert, HelpCircle } from "lucide-react";

const CONFIG: Record<Semaforo, { label: string; icon: typeof Check; classes: string }> = {
  verde: {
    label: "En meta",
    icon: Check,
    classes: "bg-status-good-bg text-status-good",
  },
  amarillo: {
    label: "Alerta",
    icon: TriangleAlert,
    classes: "bg-status-warning-bg text-[#8a6200]",
  },
  rojo: {
    label: "Fuera de meta",
    icon: CircleAlert,
    classes: "bg-status-critical-bg text-status-critical",
  },
  sin_meta: {
    label: "Sin meta",
    icon: HelpCircle,
    classes: "bg-ink-muted/10 text-ink-muted",
  },
};

export function SemaforoBadge({ estado, className }: { estado: Semaforo; className?: string }) {
  const { label, icon: Icon, classes } = CONFIG[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function semaforoDotClass(estado: Semaforo): string {
  return {
    verde: "bg-status-good",
    amarillo: "bg-status-warning",
    rojo: "bg-status-critical",
    sin_meta: "bg-ink-muted",
  }[estado];
}
