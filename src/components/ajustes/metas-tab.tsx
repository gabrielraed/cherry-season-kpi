"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { KPI_CATALOG, type GoalLike } from "@/lib/kpi";

export interface UserOption {
  id: string;
  nombre: string;
  cargo?: string | null;
}

export interface ResponsibleByTipo {
  confeccion?: { userId: string; frecuencia: string };
  cumplimiento?: { userId: string; frecuencia: string };
}

function userLabel(u: UserOption) {
  return u.cargo ? `${u.nombre} · ${u.cargo}` : u.nombre;
}

export function MetasTab({
  goals,
  responsibles,
  users,
}: {
  goals: Record<string, GoalLike>;
  responsibles: Record<string, ResponsibleByTipo>;
  users: UserOption[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Metas y semáforo</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                <th className="px-4 py-2 font-medium">KPI</th>
                <th className="px-4 py-2 font-medium">Mejor es</th>
                <th className="px-4 py-2 font-medium">Meta verde</th>
                <th className="px-4 py-2 font-medium">Meta amarillo</th>
                <th className="px-4 py-2 font-medium">Resp. confección</th>
                <th className="px-4 py-2 font-medium">Resp. cumplimiento</th>
                <th className="px-4 py-2 font-medium">Frecuencia</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {KPI_CATALOG.map((kpi) => (
                <MetaRow
                  key={kpi.code}
                  kpiCode={kpi.code}
                  label={kpi.label}
                  goal={goals[kpi.code]}
                  responsible={responsibles[kpi.code]}
                  defaultHigherIsBetter={kpi.higherIsBetter}
                  users={users}
                />
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      <p className="text-xs text-ink-muted">
        <strong>Confección:</strong> quién carga el dato del KPI. <strong>Cumplimiento:</strong> quién responde
        por el resultado frente a la meta.
      </p>
    </div>
  );
}

function MetaRow({
  kpiCode,
  label,
  goal,
  responsible,
  defaultHigherIsBetter,
  users,
}: {
  kpiCode: string;
  label: string;
  goal?: GoalLike;
  responsible?: ResponsibleByTipo;
  defaultHigherIsBetter: boolean;
  users: UserOption[];
}) {
  const router = useRouter();
  const [higherIsBetter, setHigherIsBetter] = useState(goal?.higherIsBetter ?? defaultHigherIsBetter);
  const [verde, setVerde] = useState(goal?.verdeThreshold ?? 0);
  const [amarillo, setAmarillo] = useState(goal?.amarilloThreshold ?? 0);
  const [confeccionId, setConfeccionId] = useState(responsible?.confeccion?.userId ?? "");
  const [cumplimientoId, setCumplimientoId] = useState(responsible?.cumplimiento?.userId ?? "");
  const [frecuencia, setFrecuencia] = useState(
    responsible?.cumplimiento?.frecuencia ?? responsible?.confeccion?.frecuencia ?? "semanal"
  );
  const [saving, setSaving] = useState(false);

  async function saveGoal() {
    setSaving(true);
    try {
      await fetch("/api/ajustes/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpiCode,
          localId: null,
          higherIsBetter,
          verdeThreshold: verde,
          amarilloThreshold: amarillo,
        }),
      });
      if (confeccionId) {
        await fetch("/api/ajustes/metas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "responsible",
            tipo: "confeccion",
            kpiCode,
            localId: null,
            userId: confeccionId,
            frecuencia,
          }),
        });
      }
      if (cumplimientoId) {
        await fetch("/api/ajustes/metas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "responsible",
            tipo: "cumplimiento",
            kpiCode,
            localId: null,
            userId: cumplimientoId,
            frecuencia,
          }),
        });
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2 font-medium">{label}</td>
      <td className="px-4 py-2">
        <Select value={higherIsBetter ? "mayor" : "menor"} onChange={(e) => setHigherIsBetter(e.target.value === "mayor")}>
          <option value="mayor">Mayor</option>
          <option value="menor">Menor</option>
        </Select>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="any"
          className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm"
          value={verde}
          onChange={(e) => setVerde(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          step="any"
          className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm"
          value={amarillo}
          onChange={(e) => setAmarillo(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-2">
        <Select value={confeccionId} onChange={(e) => setConfeccionId(e.target.value)} className="min-w-[160px]">
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {userLabel(u)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-2">
        <Select value={cumplimientoId} onChange={(e) => setCumplimientoId(e.target.value)} className="min-w-[160px]">
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {userLabel(u)}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-2">
        <Select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </Select>
      </td>
      <td className="px-4 py-2">
        <Button size="sm" variant="secondary" onClick={saveGoal} disabled={saving}>
          Guardar
        </Button>
      </td>
    </tr>
  );
}
