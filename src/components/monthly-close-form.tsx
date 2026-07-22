"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface MonthlyCloseValues {
  ebitda: number;
  resultadoOperativo: number;
  resultadoNetoConsolidado: number;
  flujoCajaOperativo: number;
  flujoCajaInversion: number;
  flujoCajaFinanciacion: number;
  saldoCajaInicial: number;
  saldoCajaFinal: number;
  notas: string;
}

const EMPTY: MonthlyCloseValues = {
  ebitda: 0,
  resultadoOperativo: 0,
  resultadoNetoConsolidado: 0,
  flujoCajaOperativo: 0,
  flujoCajaInversion: 0,
  flujoCajaFinanciacion: 0,
  saldoCajaInicial: 0,
  saldoCajaFinal: 0,
  notas: "",
};

const FIELDS: Array<{ key: keyof MonthlyCloseValues; label: string; group: "economico" | "financiero" }> = [
  { key: "ebitda", label: "EBITDA / resultado operativo ($)", group: "economico" },
  { key: "resultadoOperativo", label: "Resultado operativo ($)", group: "economico" },
  { key: "resultadoNetoConsolidado", label: "Resultado neto consolidado ($)", group: "economico" },
  { key: "flujoCajaOperativo", label: "Flujo de caja operativo ($)", group: "financiero" },
  { key: "flujoCajaInversion", label: "Flujo de caja de inversión ($)", group: "financiero" },
  { key: "flujoCajaFinanciacion", label: "Flujo de caja de financiación ($)", group: "financiero" },
  { key: "saldoCajaInicial", label: "Saldo de caja inicial ($)", group: "financiero" },
  { key: "saldoCajaFinal", label: "Saldo de caja final ($)", group: "financiero" },
];

export function MonthlyCloseForm({
  monthId,
  localId,
  initial,
}: {
  monthId: string;
  localId?: string | null;
  initial?: Partial<MonthlyCloseValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<MonthlyCloseValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(key: keyof MonthlyCloseValues, raw: string) {
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
      const res = await fetch(`/api/mensual/${monthId}/cierre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, localId: localId ?? null }),
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <Label>Notas del cierre</Label>
        <textarea
          className="w-full rounded-lg border border-border bg-surface p-2 text-sm"
          rows={2}
          value={values.notas}
          onChange={(e) => update("notas", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cierre"}
        </Button>
        {saved && <span className="text-sm text-[color:var(--success-text)]">Guardado ✓</span>}
      </div>
    </form>
  );
}
