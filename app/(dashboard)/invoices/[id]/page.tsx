import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isPro = (session!.user as any).plan === "pro";
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, company: { userId: (session!.user as any).id } },
    include: { items: true, client: true },
  });

  if (!invoice) notFound();

  const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const subtotal = invoice.items.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice), 0);
  const discount = (subtotal * Number(invoice.discountPercent)) / 100;
  const tax = ((subtotal - discount) * Number(invoice.taxPercent)) / 100;
  const total = subtotal - discount + tax;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800 mb-4 inline-block">
          ← Kembali ke dashboard
        </Link>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 text-white flex items-center justify-between shadow-lg shadow-slate-900/10">
          <div>
            <p className="text-xs text-slate-300 mb-1">INVOICE</p>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNo}</h1>
            <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full capitalize font-medium ${statusStyle[invoice.status] || statusStyle.draft}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" className="bg-white text-slate-900 rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-100 transition-colors">
              Download PDF
            </a>
            <DeleteInvoiceButton invoiceId={invoice.id} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">Klien</p>
            <p className="font-semibold text-slate-900">{invoice.client.name}</p>
            {invoice.client.email && <p className="text-sm text-slate-500 mt-1">{invoice.client.email}</p>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">Jatuh tempo</p>
            <p className="font-semibold text-slate-900">
              {new Date(invoice.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {!isPro && (
          <a
            href="https://wa.me/6281222070669?text=Halo%2C%20saya%20mau%20upgrade%20ke%20paket%20Pro%20Marc%20Invoice%20Generator"
            target="_blank"
            className="block bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
          >
            PDF ini akan ada watermark "MARCINVOICE" (paket Free). Upgrade ke Pro (Rp30.000) via WhatsApp untuk PDF tanpa watermark →
          </a>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-medium">Deskripsi</th>
                <th className="py-3 px-4 font-medium">Qty</th>
                <th className="py-3 px-4 font-medium text-right">Harga</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">{item.description}</td>
                  <td className="py-3 px-4 text-slate-600">{Number(item.qty)} {item.unit}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{rupiah(Number(item.unitPrice))}</td>
                  <td className="py-3 px-4 text-right font-medium">{rupiah(Number(item.qty) * Number(item.unitPrice))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Diskon ({Number(invoice.discountPercent)}%)</span><span>-{rupiah(discount)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Pajak ({Number(invoice.taxPercent)}%)</span><span>{rupiah(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total</span><span>{rupiah(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
