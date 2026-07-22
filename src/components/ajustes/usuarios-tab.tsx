"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

export interface UserRow {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "ENCARGADO";
  cargo?: string | null;
  localIds: string[];
}

export interface LocalOption {
  id: string;
  nombre: string;
}

export function UsuariosTab({ users, locales }: { users: UserRow[]; locales: LocalOption[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {users.map((u) => (
            <UserRowEditor key={u.id} user={u} locales={locales} />
          ))}
        </CardBody>
      </Card>

      <NuevoUsuarioForm locales={locales} />
    </div>
  );
}

function UserRowEditor({ user, locales }: { user: UserRow; locales: LocalOption[] }) {
  const router = useRouter();
  const [rol, setRol] = useState(user.rol);
  const [cargo, setCargo] = useState(user.cargo ?? "");
  const [localIds, setLocalIds] = useState<string[]>(user.localIds);
  const [saving, setSaving] = useState(false);

  function toggleLocal(id: string) {
    setLocalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/ajustes/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, rol, cargo, localIds }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{user.nombre}</p>
          <p className="text-xs text-ink-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Cargo / rol (ej: Encargado de Marketing)"
            className="w-56"
          />
          <Select value={rol} onChange={(e) => setRol(e.target.value as "ADMIN" | "ENCARGADO")} className="w-44">
            <option value="ADMIN">Gerencia (admin)</option>
            <option value="ENCARGADO">Encargado de local</option>
          </Select>
        </div>
      </div>
      {rol === "ENCARGADO" && (
        <div className="mt-2 flex flex-wrap gap-3">
          {locales.map((l) => (
            <label key={l.id} className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <input
                type="checkbox"
                checked={localIds.includes(l.id)}
                onChange={() => toggleLocal(l.id)}
              />
              {l.nombre}
            </label>
          ))}
        </div>
      )}
      <div className="mt-2">
        <Button size="sm" variant="secondary" onClick={save} disabled={saving}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

function NuevoUsuarioForm({ locales }: { locales: LocalOption[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [cargo, setCargo] = useState("");
  const [rol, setRol] = useState<"ADMIN" | "ENCARGADO">("ENCARGADO");
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleLocal(id: string) {
    setLocalIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ajustes/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, password, cargo, rol, localIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el usuario.");
        return;
      }
      setEmail("");
      setNombre("");
      setPassword("");
      setCargo("");
      setLocalIds([]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar usuario</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Contraseña provisoria">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Field label="Cargo / rol (libre)">
              <Input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="ej: Encargado de Marketing, Contador..."
              />
            </Field>
            <Field label="Nivel de acceso">
              <Select value={rol} onChange={(e) => setRol(e.target.value as "ADMIN" | "ENCARGADO")}>
                <option value="ADMIN">Gerencia (admin)</option>
                <option value="ENCARGADO">Encargado de local</option>
              </Select>
            </Field>
          </div>
          {rol === "ENCARGADO" && (
            <div className="flex flex-wrap gap-3">
              {locales.map((l) => (
                <label key={l.id} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={localIds.includes(l.id)}
                    onChange={() => toggleLocal(l.id)}
                  />
                  {l.nombre}
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <Button type="submit" disabled={saving}>
            Crear usuario
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
