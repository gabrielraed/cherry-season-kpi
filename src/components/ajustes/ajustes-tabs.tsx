"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { LocalesTab, type LocalRow } from "@/components/ajustes/locales-tab";
import { MetasTab, type ResponsibleByTipo, type UserOption } from "@/components/ajustes/metas-tab";
import { UsuariosTab, type UserRow, type LocalOption } from "@/components/ajustes/usuarios-tab";
import type { GoalLike } from "@/lib/kpi";

const TABS = [
  { key: "locales", label: "Locales" },
  { key: "metas", label: "Metas y responsables" },
  { key: "usuarios", label: "Usuarios" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AjustesTabs({
  locales,
  goals,
  responsibles,
  userOptions,
  users,
}: {
  locales: LocalRow[];
  goals: Record<string, GoalLike>;
  responsibles: Record<string, ResponsibleByTipo>;
  userOptions: UserOption[];
  users: UserRow[];
}) {
  const [tab, setTab] = useState<TabKey>("locales");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "bg-brand text-white" : "text-ink-secondary hover:bg-brand-tint"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "locales" && <LocalesTab locales={locales} />}
      {tab === "metas" && <MetasTab goals={goals} responsibles={responsibles} users={userOptions} />}
      {tab === "usuarios" && (
        <UsuariosTab users={users} locales={locales as LocalOption[]} />
      )}
    </div>
  );
}
