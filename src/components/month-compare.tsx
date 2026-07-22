"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { formatKpiValue, kpiDef } from "@/lib/kpi";

const COMPARE_CODES = [
  "ventas_mes",
  "cantidad_tickets",
  "flujo_caja_neto",
  "ebitda",
  "resultado_neto_consolidado",
] as const;

interface MonthOption {
  id: string;
  label: string;
}

interface MonthlyKpis {
  ventas_mes: number;
  cantidad_tickets: number;
  flujo_caja_neto: number;
  ebitda: number;
  resultado_neto_consolidado: number;
}

interface Resumen {
  label: string;
  hasClose: boolean;
  kpis: MonthlyKpis;
}

export function MonthCompare({ months }: { months: MonthOption[] }) {
  const [idA, setIdA] = useState(months[1]?.id ?? months[0]?.id ?? "");
  const [idB, setIdB] = useState(months[0]?.id ?? "");
  const [dataA, setDataA] = useState<Resumen | null>(null);
  const [dataB, setDataB] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idA || !idB) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/mensual/${idA}/resumen`).then((r) => r.json()),
      fetch(`/api/mensual/${idB}/resumen`).then((r) => r.json()),
    ])
      .then(([a, b]) => {
        setDataA(a);
        setDataB(b);
      })
      .finally(() => setLoading(false));
  }, [idA, idB]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparar meses</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select value={idA} onChange={(e) => setIdA(e.target.value)} className="capitalize">
            {months.map((m) => (
              <option key={m.id} value={m.id} className="capitalize">
                {m.label}
              </option>
            ))}
          </Select>
          <Select value={idB} onChange={(e) => setIdB(e.target.value)} className="capitalize">
            {months.map((m) => (
              <option key={m.id} value={m.id} className="capitalize">
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        {loading && <p className="text-sm text-ink-muted">Cargando...</p>}

        {!loading && dataA && dataB && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="py-2 pr-2 font-medium">KPI</th>
                  <th className="py-2 pr-2 font-medium">A</th>
                  <th className="py-2 pr-2 font-medium">B</th>
                  <th className="py-2 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_CODES.map((code) => {
                  const def = kpiDef(code);
                  const valueA = dataA.kpis[code];
                  const valueB = dataB.kpis[code];
                  const rawDiff = valueB - valueA;
                  const diff = Math.abs(rawDiff) < 0.005 ? 0 : rawDiff;
                  const improved = def.higherIsBetter ? diff > 0 : diff < 0;
                  const worsened = def.higherIsBetter ? diff < 0 : diff > 0;
                  return (
                    <tr key={code} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2 text-ink-secondary">{def.label}</td>
                      <td className="py-2 pr-2 tabular-nums">{formatKpiValue(valueA, def.unit)}</td>
                      <td className="py-2 pr-2 tabular-nums">{formatKpiValue(valueB, def.unit)}</td>
                      <td
                        className="py-2 tabular-nums"
                        style={{
                          color: improved
                            ? "var(--status-good)"
                            : worsened
                              ? "var(--status-critical)"
                              : "var(--ink-muted)",
                        }}
                      >
                        {diff > 0 ? "+" : ""}
                        {formatKpiValue(diff, def.unit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
