"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Hapus invoice ini? Tindakan ini tidak bisa dibatalkan.")) return;

    setBusy(true);
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      alert("Gagal menghapus invoice");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-sm bg-white/10 border border-red-400/40 text-red-300 rounded-md px-4 py-2 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
    >
      {busy ? "Menghapus..." : "Hapus invoice"}
    </button>
  );
}
