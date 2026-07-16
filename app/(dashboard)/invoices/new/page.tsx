"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { description: string; subDescription: string; qty: number; unit: string; unitPrice: number };

export default function NewInvoicePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", address: "", picName: "", phone: "", email: "" });
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(11);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", subDescription: "", qty: 1, unit: "", unitPrice: 0 }]);

  useEffect(() => {
    fetch("/api/companies").then((r) => r.json()).then((d) => { setCompanies(d); if (d[0]) setCompanyId(d[0].id); });
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  function updateItem(i: number, key: keyof Item, value: string | number) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", subDescription: "", qty: 1, unit: "", unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const discount = (subtotal * discountPercent) / 100;
  const tax = ((subtotal - discount) * taxPercent) / 100;
  const total = subtotal - discount + tax;
  const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalClientId = clientId;
    if (!finalClientId && newClient.name) {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const created = await res.json();
      finalClientId = created.id;
    }

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId, clientId: finalClientId, invoiceNo, invoiceDate, dueDate,
        discountPercent, taxPercent, notes, items,
      }),
    });

    if (res.ok) {
      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Invoice baru</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-semibold">Detail invoice</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nomor invoice" value={invoiceNo} onChange={setInvoiceNo} required />
            <Field label="Tanggal invoice" type="date" value={invoiceDate} onChange={setInvoiceDate} required />
            <Field label="Jatuh tempo" type="date" value={dueDate} onChange={setDueDate} required />
            <div>
              <label className="block text-sm mb-1">Klien</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                <option value="">-- Klien baru --</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {!clientId && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Field label="Nama klien" value={newClient.name} onChange={(v) => setNewClient((c) => ({ ...c, name: v }))} required />
              <Field label="PIC" value={newClient.picName} onChange={(v) => setNewClient((c) => ({ ...c, picName: v }))} />
              <Field label="Alamat" value={newClient.address} onChange={(v) => setNewClient((c) => ({ ...c, address: v }))} />
              <Field label="Telepon" value={newClient.phone} onChange={(v) => setNewClient((c) => ({ ...c, phone: v }))} />
              <Field label="Email" value={newClient.email} onChange={(v) => setNewClient((c) => ({ ...c, email: v }))} />
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
          <h2 className="text-sm font-semibold">Item</h2>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border-b border-slate-100 pb-3">
              <div className="col-span-4">
                <label className="block text-xs mb-1">Deskripsi</label>
                <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm" required />
                <input value={item.subDescription} onChange={(e) => updateItem(i, "subDescription", e.target.value)} placeholder="Sub-deskripsi (opsional)" className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs mt-1" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs mb-1">Qty</label>
                <input type="number" value={item.qty} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs mb-1">Satuan</label>
                <input value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs mb-1">Harga satuan</label>
                <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-1 text-right">
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 text-xs">Hapus</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-sm text-blue-600">+ Tambah item</button>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Diskon (%)" type="number" value={String(discountPercent)} onChange={(v) => setDiscountPercent(Number(v))} />
            <Field label="Pajak / PPN (%)" type="number" value={String(taxPercent)} onChange={(v) => setTaxPercent(Number(v))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Catatan</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="text-sm text-right space-y-1 border-t border-slate-100 pt-3">
            <p>Subtotal: {rupiah(subtotal)}</p>
            <p>Diskon: -{rupiah(discount)}</p>
            <p>Pajak: {rupiah(tax)}</p>
            <p className="font-semibold text-base">Total: {rupiah(total)}</p>
          </div>
        </section>

        <button type="submit" className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium">
          Simpan invoice
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type={type} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}
