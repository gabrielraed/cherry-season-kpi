"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

export function LocalFilter({
  locales,
  selected,
}: {
  locales: Array<{ id: string; nombre: string }>;
  selected: string; // "all" o el id del local
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("local");
    else params.set("local", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={selected} onChange={(e) => onChange(e.target.value)} className="w-44">
      <option value="all">Todos los locales</option>
      {locales.map((l) => (
        <option key={l.id} value={l.id}>
          {l.nombre}
        </option>
      ))}
    </Select>
  );
}
