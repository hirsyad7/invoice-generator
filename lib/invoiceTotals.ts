// Dipindah ke sini dari app/api/invoices/route.ts, karena file route.ts
// di Next.js App Router HANYA boleh mengekspor method HTTP (GET, POST, dst),
// tidak boleh ada export helper function lain — ini baru ketahuan gagal
// saat `next build` (production), meski jalan normal saat `next dev`.
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
