"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";

export function WeekPicker({
  weeks,
  selected,
}: {
  weeks: Array<{ id: string; label: string }>;
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={selected} onChange={(e) => onChange(e.target.value)} className="w-56">
      {weeks.map((w) => (
        <option key={w.id} value={w.id}>
          {w.label}
        </option>
      ))}
    </Select>
  );
}
