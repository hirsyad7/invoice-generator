import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === (session.user as any).id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  // Cascade dari relasi Prisma otomatis menghapus company/client/invoice
  // milik user ini juga (sudah diset onDelete: Cascade di schema).
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (body.plan !== "free" && body.plan !== "pro") {
    return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { plan: body.plan },
  });

  return NextResponse.json(user);
}
