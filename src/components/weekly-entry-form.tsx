"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface WeeklyEntryFormValues {
  ventas: number;
  costoInsumos: number;
  costoLaboral: number;
  gastoEstructura: number;
  comisionesApps: number;
  marketing: number;
  descartes: number;
  vajilla: number;
  cantidadTickets: number;
  ingresoCaja: number;
  egresoCaja: number;
  notas: string;
}

const EMPTY: WeeklyEntryFormValues = {
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
  notas: "",
};

const FIELDS: Array<{ key: keyof WeeklyEntryFormValues; label: string; group: "economico" | "financiero" }> = [
  { key: "ventas", label: "Ventas ($)", group: "economico" },
  { key: "costoInsumos", label: "Costo de insumos ($)", group: "economico" },
  { key: "costoLaboral", label: "Costo laboral ($)", group: "economico" },
  { key: "gastoEstructura", label: "Gasto de estructura ($)", group: "economico" },
  { key: "comisionesApps", label: "Comisiones Apps ($)", group: "economico" },
  { key: "marketing", label: "Marketing ($)", group: "economico" },
  { key: "descartes", label: "Descartes ($)", group: "economico" },
  { key: "vajilla", label: "Vajilla ($)", group: "economico" },
  { key: "cantidadTickets", label: "Cantidad de tickets", group: "economico" },
  { key: "ingresoCaja", label: "Ingreso de caja ($)", group: "financiero" },
  { key: "egresoCaja", label: "Egreso de caja ($)", group: "financiero" },
];

export function WeeklyEntryForm({
  weekId,
  localId,
  localNombre,
  initial,
}: {
  weekId: string;
  localId: string;
  localNombre: string;
  initial?: Partial<WeeklyEntryFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<WeeklyEntryFormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: keyof WeeklyEntryFormValues, raw: string) {
    setSaved(false);
    if (key === "notas") {
      setValues((v) => ({ ...v, notas: raw }));
      return;
    }
    setValues((v) => ({ ...v, [key]: raw === "" ? 0 : Number(raw) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/semanal/${weekId}/entradas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localId, ...values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Cierre económico
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELDS.filter((f) => f.group === "economico").map((f) => (
            <Field key={f.key} label={f.label}>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={values[f.key] === 0 ? "" : values[f.key]}
                placeholder="0"
                onChange={(e) => update(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Cierre financiero
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELDS.filter((f) => f.group === "financiero").map((f) => (
            <Field key={f.key} label={f.label}>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={values[f.key] === 0 ? "" : values[f.key]}
                placeholder="0"
                onChange={(e) => update(f.key, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <textarea
          className="w-full rounded-lg border border-border bg-surface p-2 text-sm"
          rows={2}
          value={values.notas}
          onChange={(e) => update("notas", e.target.value)}
          placeholder={`Observaciones de ${localNombre} para esta semana...`}
        />
      </div>

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
        {saved && <span className="text-sm text-[color:var(--success-text)]">Guardado ✓</span>}
      </div>
    </form>
  );
}
