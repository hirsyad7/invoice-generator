import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bankAccounts, ...companyData } = body;

  // Pastikan company ini memang milik user yang sedang login
  const existing = await prisma.companyProfile.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ganti seluruh rekening bank dengan yang baru dikirim dari form
  // (lebih sederhana daripada mencocokkan satu-satu mana yang berubah).
  await prisma.bankAccount.deleteMany({ where: { companyId: params.id } });

  const company = await prisma.companyProfile.update({
    where: { id: params.id },
    data: {
      ...companyData,
      bankAccounts: bankAccounts?.length ? { create: bankAccounts } : undefined,
    },
    include: { bankAccounts: true },
  });

  return NextResponse.json(company);
}
