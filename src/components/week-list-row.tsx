"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SemaforoBadge } from "@/components/ui/semaforo-badge";
import { formatKpiValue } from "@/lib/kpi";
import type { Semaforo } from "@/lib/kpi";
import { Pencil, Trash2 } from "lucide-react";

export function WeekListRow({
  id,
  label,
  hasData,
  ventas,
  semaforo,
  isAdmin,
}: {
  id: string;
  label: string;
  hasData: boolean;
  ventas: number;
  semaforo: Semaforo;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm(`¿Borrar todos los datos cargados de "${label}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/semanal/${id}/entradas`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <Link href={`/semanal/${id}`} className="min-w-0 flex-1">
        <p className="font-medium text-ink-primary">{label}</p>
        <p className="text-xs text-ink-muted">
          {hasData ? formatKpiValue(ventas, "currency") : "Sin datos cargados"}
        </p>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {hasData && <SemaforoBadge estado={semaforo} className="hidden sm:inline-flex" />}
        <Link href={`/semanal/${id}`}>
          <Button variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </Link>
        {isAdmin && hasData && (
          <Button variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{deleting ? "Borrando..." : "Borrar"}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
