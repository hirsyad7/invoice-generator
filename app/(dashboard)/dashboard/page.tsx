import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

const statusStyle: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const [company, invoices] = await Promise.all([
    prisma.companyProfile.findFirst({ where: { userId }, include: { bankAccounts: true } }),
    prisma.invoice.findMany({
      where: { company: { userId } },
      include: { client: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalValue = invoices.reduce((sum, inv) => {
    const sub = inv.items.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice), 0);
    const discount = (sub * Number(inv.discountPercent)) / 100;
    const tax = ((sub - discount) * Number(inv.taxPercent)) / 100;
    return sum + (sub - discount + tax);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Header dengan preview perusahaan */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 text-white flex items-center justify-between shadow-lg shadow-slate-900/10">
          <div className="flex items-center gap-4">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover bg-white/10 p-1" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold">
                {company?.name?.[0] || "?"}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">{company?.name || "Belum ada profil perusahaan"}</p>
              <p className="text-sm text-slate-300">{company?.tagline || "Lengkapi profil perusahaan kamu"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm bg-white/10 hover:bg-white/20 transition-colors rounded-md px-3 py-2">
              {company ? "Edit profil" : "Buat profil"}
            </Link>
            {(session!.user as any).role === "admin" && (
              <Link href="/admin" className="text-sm bg-white/10 hover:bg-white/20 transition-colors rounded-md px-3 py-2">
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Ajakan upgrade ke Pro, hanya muncul untuk user free */}
        {(session!.user as any).plan !== "pro" && (
          <a
            href="https://wa.me/6281222070669?text=Halo%2C%20saya%20mau%20upgrade%20ke%20paket%20Pro%20Marc%20Invoice%20Generator"
            target="_blank"
            className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">Masih pakai paket Free — PDF invoice kamu ada watermark "MARCINVOICE"</p>
                <p className="text-sm text-amber-700 mt-0.5">Upgrade ke Pro (Rp30.000) buat hapus watermark. Klik di sini untuk hubungi via WhatsApp.</p>
              </div>
              <span className="text-xs bg-amber-900 text-white rounded-md px-3 py-2 font-medium whitespace-nowrap">Upgrade sekarang</span>
            </div>
          </a>
        )}

        {/* Ringkasan singkat */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">Total invoice</p>
            <p className="text-2xl font-semibold text-slate-900">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">Total nilai invoice</p>
            <p className="text-2xl font-semibold text-slate-900">{rupiah(totalValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">Rekening terdaftar</p>
            <p className="text-2xl font-semibold text-slate-900">{company?.bankAccounts.length || 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Daftar invoice</h1>
          <Link href="/invoices/new" className="text-sm bg-slate-900 hover:bg-slate-800 transition-colors text-white rounded-md px-4 py-2 font-medium shadow-sm">
            + Invoice baru
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y overflow-hidden">
          {invoices.length === 0 && (
            <p className="p-8 text-sm text-slate-500 text-center">
              Belum ada invoice. {!company && "Lengkapi profil perusahaan dulu, lalu "}buat invoice pertamamu.
            </p>
          )}
          {invoices.map((inv) => {
            const sub = inv.items.reduce((s, it) => s + Number(it.qty) * Number(it.unitPrice), 0);
            const discount = (sub * Number(inv.discountPercent)) / 100;
            const tax = ((sub - discount) * Number(inv.taxPercent)) / 100;
            const total = sub - discount + tax;

            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-sm text-slate-900">{inv.invoiceNo}</p>
                  <p className="text-sm text-slate-500">{inv.client.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700">{rupiah(total)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${statusStyle[inv.status] || statusStyle.draft}`}>
                    {inv.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
