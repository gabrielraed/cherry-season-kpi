"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { CherryLogo } from "@/components/logo";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Upload,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tablero", icon: LayoutDashboard },
  { href: "/semanal", label: "Semanal", icon: CalendarDays },
  { href: "/mensual", label: "Mensual", icon: CalendarRange },
  { href: "/importar", label: "Importar", icon: Upload },
] as const;

const ADMIN_ITEM = { href: "/ajustes", label: "Ajustes", icon: Settings } as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({
  isAdmin,
  nombre,
}: {
  isAdmin: boolean;
  nombre: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface sm:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <CherryLogo className="h-9 w-9 shrink-0" />
          <div>
            <p className="text-sm font-semibold leading-tight">
              <span className="text-[#6b1f24]">Cherry</span>
              <span className="text-[#d94f2b]">Season</span>
            </p>
            <p className="text-xs text-ink-muted leading-tight">Reporte de KPIs</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-tint text-brand-strong"
                    : "text-ink-secondary hover:bg-brand-tint/60 hover:text-ink-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <p className="truncate px-3 text-xs text-ink-muted">{nombre}</p>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-brand-tint/60 hover:text-ink-primary"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile: top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        <div className="flex items-center gap-2">
          <CherryLogo className="h-7 w-7 shrink-0" />
          <span className="text-sm font-semibold">
            <span className="text-[#6b1f24]">Cherry</span>
            <span className="text-[#d94f2b]">Season</span>
          </span>
        </div>
        <button
          onClick={logout}
          aria-label="Cerrar sesión"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-brand-tint/60"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile: bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface sm:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-brand-strong" : "text-ink-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
