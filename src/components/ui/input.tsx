import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink-primary",
        "placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink-primary",
        "focus:outline-none focus:ring-2 focus:ring-brand/40",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium text-ink-secondary", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  suffix,
}: {
  label: string;
  children: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
