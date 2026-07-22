"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export interface LocalRow {
  id: string;
  nombre: string;
  activo: boolean;
}

export function LocalesTab({ locales }: { locales: LocalRow[] }) {
  const router = useRouter();
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [saving, setSaving] = useState(false);

  async function addLocal(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/ajustes/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre.trim() }),
      });
      setNuevoNombre("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(local: LocalRow) {
    await fetch("/api/ajustes/locales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: local.id, activo: !local.activo }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Locales</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {locales.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className={l.activo ? "" : "text-ink-muted line-through"}>{l.nombre}</span>
              <Button variant="ghost" size="sm" onClick={() => toggleActivo(l)}>
                {l.activo ? "Desactivar" : "Activar"}
              </Button>
            </div>
          ))}
          {locales.length === 0 && <p className="text-sm text-ink-muted">Todavía no hay locales.</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar local</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={addLocal} className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Nombre del local">
                <Input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
              </Field>
            </div>
            <Button type="submit" disabled={saving}>
              Agregar
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
