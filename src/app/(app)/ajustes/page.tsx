import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AjustesTabs } from "@/components/ajustes/ajustes-tabs";
import type { GoalLike } from "@/lib/kpi";

export default async function AjustesPage() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") redirect("/dashboard");

  const [locales, users, goals, responsibles] = await Promise.all([
    prisma.local.findMany({ orderBy: { orden: "asc" } }),
    prisma.user.findMany({ include: { locales: true }, orderBy: { nombre: "asc" } }),
    prisma.kpiGoal.findMany({ where: { localId: null } }),
    prisma.kpiResponsible.findMany({ where: { localId: null } }),
  ]);

  const goalsMap: Record<string, GoalLike> = Object.fromEntries(
    goals.map((g) => [
      g.kpiCode,
      { higherIsBetter: g.higherIsBetter, verdeThreshold: g.verdeThreshold, amarilloThreshold: g.amarilloThreshold },
    ])
  );

  const responsiblesMap: Record<
    string,
    { confeccion?: { userId: string; frecuencia: string }; cumplimiento?: { userId: string; frecuencia: string } }
  > = {};
  for (const r of responsibles) {
    responsiblesMap[r.kpiCode] ??= {};
    responsiblesMap[r.kpiCode][r.tipo] = { userId: r.userId, frecuencia: r.frecuencia };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="text-sm text-ink-secondary">Locales, metas/semáforo, responsables y usuarios.</p>
      </div>
      <AjustesTabs
        locales={locales}
        goals={goalsMap}
        responsibles={responsiblesMap}
        userOptions={users.map((u) => ({ id: u.id, nombre: u.nombre, cargo: u.cargo }))}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          nombre: u.nombre,
          rol: u.rol,
          cargo: u.cargo,
          localIds: u.locales.map((l) => l.localId),
        }))}
      />
    </div>
  );
}
