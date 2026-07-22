import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (session.rol !== "ADMIN") {
    return { error: NextResponse.json({ error: "Solo la gerencia puede editar locales." }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const count = await prisma.local.count();
  const local = await prisma.local.create({ data: { nombre, orden: count } });
  return NextResponse.json(local);
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Falta el id del local." }, { status: 400 });

  const data: { nombre?: string; activo?: boolean } = {};
  if (typeof body?.nombre === "string" && body.nombre.trim()) data.nombre = body.nombre.trim();
  if (typeof body?.activo === "boolean") data.activo = body.activo;

  const local = await prisma.local.update({ where: { id }, data });
  return NextResponse.json(local);
}
