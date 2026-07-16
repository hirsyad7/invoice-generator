import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { company: { userId: (session.user as any).id } },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, companyId, ...invoiceData } = body;

  // Ambil data perusahaan saat ini (termasuk rekening bank) dan "bekukan" jadi
  // snapshot di dalam invoice ini, supaya kalau profil diedit nanti,
  // invoice yang sudah dibuat tetap menampilkan data seperti saat diterbitkan.
  const company = await prisma.companyProfile.findFirst({
    where: { id: companyId, userId: (session.user as any).id },
    include: { bankAccounts: true },
  });
  if (!company) return NextResponse.json({ error: "Profil perusahaan tidak ditemukan" }, { status: 400 });

  const invoice = await prisma.invoice.create({
    data: {
      ...invoiceData,
      companyId,
      companySnapshot: company as any,
      invoiceDate: new Date(invoiceData.invoiceDate),
      dueDate: new Date(invoiceData.dueDate),
      items: {
        create: items.map((item: any, i: number) => ({ ...item, sortOrder: i })),
      },
    },
    include: { items: true, client: true, company: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}

// Dipakai halaman form untuk preview total sebelum submit,
// dan dipakai print template untuk cetak PDF.
export function calculateInvoiceTotals(
  items: { qty: number; unitPrice: number }[],
  discountPercent: number,
  taxPercent: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const discount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * taxPercent) / 100;
  const total = afterDiscount + tax;

  return { subtotal, discount, tax, total };
}
