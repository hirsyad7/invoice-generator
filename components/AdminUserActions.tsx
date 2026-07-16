"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserActions({ userId, plan }: { userId: string; plan: string }) {
  const router = useRouter();
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePlanToggle() {
    setBusy(true);
    const newPlan = plan === "pro" ? "free" : "pro";
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    if (res.ok) router.refresh();
    else alert("Gagal mengubah plan");
    setBusy(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();

    if (!res.ok) setMessage(data.error || "Gagal reset password");
    else {
      setMessage("Password berhasil direset.");
      setNewPassword("");
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Hapus user ini beserta semua data perusahaan/invoice-nya? Tindakan ini tidak bisa dibatalkan.")) return;

    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Gagal menghapus user");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={handlePlanToggle}
          disabled={busy}
          className={`text-xs rounded-md px-2.5 py-1.5 font-medium disabled:opacity-50 ${
            plan === "pro" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {plan === "pro" ? "Jadikan Free" : "Jadikan Pro"}
        </button>
        <button
          onClick={() => setShowReset((s) => !s)}
          className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
        >
          Reset password
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-xs border border-red-300 text-red-600 rounded-md px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-50"
        >
          Hapus
        </button>
      </div>

      {showReset && (
        <form onSubmit={handleReset} className="flex items-center gap-2 mt-1">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs w-32"
          />
          <button type="submit" disabled={busy} className="text-xs bg-slate-900 text-white rounded-md px-2.5 py-1.5 disabled:opacity-50">
            Simpan
          </button>
        </form>
      )}
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
