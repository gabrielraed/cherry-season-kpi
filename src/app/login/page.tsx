"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { CherryLogo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardBody className="space-y-5">
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <CherryLogo className="h-16 w-16" />
          <h1 className="text-lg font-semibold text-ink-primary">
            <span className="text-[#6b1f24]">Cherry</span>
            <span className="text-[#d94f2b]">Season</span>
          </h1>
          <p className="text-sm text-ink-secondary">Iniciá sesión para ver el tablero de KPIs.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, var(--brand-tint) 0%, var(--page) 70%)",
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
