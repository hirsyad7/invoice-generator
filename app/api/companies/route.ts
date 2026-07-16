import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companies = await prisma.companyProfile.findMany({
    where: { userId: (session.user as any).id },
    include: { bankAccounts: true },
  });

  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bankAccounts, ...companyData } = body;

  const company = await prisma.companyProfile.create({
    data: {
      ...companyData,
      userId: (session.user as any).id,
      bankAccounts: bankAccounts?.length
        ? { create: bankAccounts }
        : undefined,
    },
    include: { bankAccounts: true },
  });

  return NextResponse.json(company, { status: 201 });
}
