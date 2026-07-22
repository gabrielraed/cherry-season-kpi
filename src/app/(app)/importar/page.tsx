import { ImportForm } from "@/components/import-form";

export default function ImportarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Importar carga semanal</h1>
        <p className="text-sm text-ink-secondary">
          Subí un Excel o CSV con la plantilla estándar para cargar varias semanas y locales de una vez.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
