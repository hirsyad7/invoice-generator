"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bank = { bankName: string; accountNumber: string; accountName: string };

export default function ProfilePage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", tagline: "", logoUrl: "", address: "", phone: "", email: "", website: "", npwp: "",
    signerName: "", signerTitle: "",
  });
  const [banks, setBanks] = useState<Bank[]>([{ bankName: "", accountNumber: "", accountName: "" }]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((companies) => {
        const existing = companies?.[0];
        if (existing) {
          setCompanyId(existing.id);
          setForm({
            name: existing.name || "",
            tagline: existing.tagline || "",
            logoUrl: existing.logoUrl || "",
            address: existing.address || "",
            phone: existing.phone || "",
            email: existing.email || "",
            website: existing.website || "",
            npwp: existing.npwp || "",
            signerName: existing.signerName || "",
            signerTitle: existing.signerTitle || "",
          });
          if (existing.bankAccounts?.length) {
            setBanks(existing.bankAccounts.map((b: any) => ({
              bankName: b.bankName || "", accountNumber: b.accountNumber || "", accountName: b.accountName || "",
            })));
          }
        }
        setLoading(false);
      });
  }, []);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateBank(i: number, key: keyof Bank, value: string) {
    setBanks((prev) => prev.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)));
  }

  function addBank() {
    setBanks((prev) => [...prev, { bankName: "", accountNumber: "", accountName: "" }]);
  }

  function removeBank(i: number) {
    setBanks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();

    if (!res.ok) setUploadError(data.error || "Gagal upload logo");
    else update("logoUrl", data.url);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const validBanks = banks.filter((b) => b.bankName.trim());
    const payload = { ...form, bankAccounts: validBanks };

    if (companyId) {
      await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto py-10 px-4 text-sm text-slate-500">Memuat...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">
        {companyId ? "Edit profil perusahaan" : "Profil perusahaan"}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <Field label="Nama perusahaan" value={form.name} onChange={(v) => update("name", v)} required />
        <Field label="Tagline" value={form.tagline} onChange={(v) => update("tagline", v)} />

        <div>
          <label className="block text-sm mb-1">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
          {uploading && <p className="text-xs text-slate-500 mt-1">Mengupload...</p>}
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Preview logo" className="h-16 mt-2 rounded border border-slate-200" />
          )}
        </div>

        <Field label="Alamat" value={form.address} onChange={(v) => update("address", v)} />
        <Field label="Telepon" value={form.phone} onChange={(v) => update("phone", v)} />
        <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
        <Field label="Website" value={form.website} onChange={(v) => update("website", v)} />
        <Field label="NPWP" value={form.npwp} onChange={(v) => update("npwp", v)} />

        <h2 className="text-sm font-semibold pt-2">Penandatangan (untuk area tanda tangan di invoice)</h2>
        <Field label="Nama penandatangan" value={form.signerName} onChange={(v) => update("signerName", v)} />
        <Field label="Jabatan" value={form.signerTitle} onChange={(v) => update("signerTitle", v)} placeholder="mis. Direktur" />

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-sm font-semibold">Rekening bank</h2>
          <button type="button" onClick={addBank} className="text-sm text-blue-600">+ Tambah rekening</button>
        </div>

        {banks.map((bank, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-3 relative">
            {banks.length > 1 && (
              <button
                type="button"
                onClick={() => removeBank(i)}
                className="absolute top-2 right-2 text-red-500 text-xs"
              >
                Hapus
              </button>
            )}
            <Field label="Nama bank" value={bank.bankName} onChange={(v) => updateBank(i, "bankName", v)} />
            <Field label="Nomor rekening" value={bank.accountNumber} onChange={(v) => updateBank(i, "accountNumber", v)} />
            <Field label="Atas nama" value={bank.accountName} onChange={(v) => updateBank(i, "accountName", v)} />
          </div>
        ))}

        <button type="submit" disabled={saving} className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50">
          {saving ? "Menyimpan..." : companyId ? "Simpan perubahan" : "Simpan"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}
