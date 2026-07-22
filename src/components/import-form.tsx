"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, CircleCheck, TriangleAlert } from "lucide-react";

interface ImportResult {
  filasProcesadas: number;
  creados: number;
  actualizados: number;
  errores: Array<{ rowNumber: number; message: string }>;
}

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/importar/semanal", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo importar el archivo.");
        return;
      }
      setResult(data);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1. Descargá la plantilla</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-secondary">
            Incluye tus locales y una fila de ejemplo con los encabezados correctos.
          </p>
          <a href="/api/importar/plantilla">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" />
              Plantilla .xlsx
            </Button>
          </a>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Subí el archivo completo</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-brand-tint/30">
              <Upload className="h-6 w-6 text-ink-muted" />
              <span className="text-sm text-ink-secondary">
                {fileName ?? "Hacé clic para elegir un archivo .xlsx o .csv"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            {error && <p className="text-sm text-status-critical">{error}</p>}
            <Button type="submit" disabled={!fileName || loading}>
              {loading ? "Importando..." : "Importar"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-[color:var(--success-text)]">
              <CircleCheck className="h-4 w-4" />
              {result.creados} filas nuevas, {result.actualizados} actualizadas
              {result.filasProcesadas === 0 && " (0 filas con datos en el archivo)"}
            </div>
            {result.errores.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-status-critical">
                  <TriangleAlert className="h-4 w-4" />
                  {result.errores.length} fila(s) con errores
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-status-critical-bg p-3 text-xs text-status-critical">
                  {result.errores.map((e, i) => (
                    <li key={i}>
                      Fila {e.rowNumber}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
