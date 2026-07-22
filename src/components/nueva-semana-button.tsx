"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NuevaSemanaButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/semanal/nueva", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push(`/semanal/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={onClick} disabled={loading}>
      <Plus className="h-4 w-4" />
      {loading ? "Abriendo..." : "Nueva semana"}
    </Button>
  );
}
