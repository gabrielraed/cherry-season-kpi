import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (session.rol !== "ADMIN") {
    return { error: NextResponse.json({ error: "Solo la gerencia puede editar usuarios." }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const rol: Role = body?.rol === "ADMIN" ? "ADMIN" : "ENCARGADO";
  const cargo = typeof body?.cargo === "string" && body.cargo.trim() ? body.cargo.trim() : null;
  const localIds: string[] = Array.isArray(body?.localIds) ? body.localIds.filter((x: unknown) => typeof x === "string") : [];

  if (!email || !nombre || password.length < 6) {
    return NextResponse.json(
      { error: "Completá email, nombre y una contraseña de al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Ya existe un usuario con ese email." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email,
      nombre,
      rol,
      cargo,
      passwordHash: await hashPassword(password),
      locales: { create: localIds.map((localId) => ({ localId })) },
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Falta el id del usuario." }, { status: 400 });

  if (Array.isArray(body?.localIds)) {
    const localIds: string[] = body.localIds.filter((x: unknown) => typeof x === "string");
    await prisma.userLocal.deleteMany({ where: { userId: id } });
    await prisma.userLocal.createMany({ data: localIds.map((localId) => ({ userId: id, localId })) });
  }

  const data: { rol?: Role; nombre?: string; cargo?: string | null; passwordHash?: string } = {};
  if (body?.rol === "ADMIN" || body?.rol === "ENCARGADO") data.rol = body.rol;
  if (typeof body?.nombre === "string" && body.nombre.trim()) data.nombre = body.nombre.trim();
  if (typeof body?.cargo === "string") data.cargo = body.cargo.trim() || null;
  if (typeof body?.password === "string" && body.password.length >= 6) {
    data.passwordHash = await hashPassword(body.password);
  }

  const user = Object.keys(data).length > 0 ? await prisma.user.update({ where: { id }, data }) : null;
  return NextResponse.json(user ?? { ok: true });
}
