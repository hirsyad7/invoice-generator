import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminUserActions from "@/components/AdminUserActions";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      companies: { select: { name: true, _count: { select: { invoices: true } } } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Admin — Kelola user</h1>

      <div className="bg-white rounded-xl border border-slate-200 divide-y">
        {users.map((u) => {
          const company = u.companies[0];
          return (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{u.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.plan === "pro" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {u.plan === "pro" ? "Pro" : "Free"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {u.role === "admin" ? "Admin" : "User"} · Daftar {new Date(u.createdAt).toLocaleDateString("id-ID")}
                  {company && ` · ${company.name} (${company._count.invoices} invoice)`}
                </p>
              </div>
              <AdminUserActions userId={u.id} plan={u.plan} />
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="p-6 text-sm text-slate-500">Belum ada user.</p>
        )}
      </div>
    </div>
  );
}
