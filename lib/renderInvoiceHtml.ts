import fs from "fs/promises";
import path from "path";
import { calculateInvoiceTotals } from "@/app/api/invoices/route";

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

const tanggal = (d: Date) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

// Ikon monokrom kecil (inline SVG) - dipakai langsung tanpa font/CDN eksternal
// supaya Puppeteer pasti bisa render walau tanpa akses internet.
const icons = {
  pin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  phone: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/></svg>`,
  mail: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></svg>`,
  globe: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>`,
  doc: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>`,
  user: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,
  bank: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2"><path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6M6 10v6M12 10v6M18 10v6"/></svg>`,
};

// Baca file logo dari /public/uploads dan ubah jadi base64 data URI supaya
// Puppeteer pasti bisa render gambarnya tanpa bergantung pada server yang jalan.
async function getLogoDataUri(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("http")) return logoUrl;
  try {
    const filepath = path.join(process.cwd(), "public", logoUrl);
    const buffer = await fs.readFile(filepath);
    const ext = path.extname(logoUrl).replace(".", "") || "png";
    return `data:image/${ext};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderInvoiceHtml(invoice: any, showWatermark: boolean = false) {
  const items = invoice.items as any[];
  const numericItems = items.map((i) => ({ qty: Number(i.qty), unitPrice: Number(i.unitPrice) }));
  const { subtotal, discount, tax, total } = calculateInvoiceTotals(
    numericItems,
    Number(invoice.discountPercent),
    Number(invoice.taxPercent)
  );

  const banks = invoice.company.bankAccounts || [];
  const logoDataUri = await getLogoDataUri(invoice.company.logoUrl);

  const itemRows = items
    .map(
      (item, i) => `
    <tr>
      <td class="cell center">${i + 1}</td>
      <td class="cell">
        <div class="item-title">${item.description}</div>
        ${item.subDescription ? `<div class="item-sub">${item.subDescription}</div>` : ""}
      </td>
      <td class="cell center">${Number(item.qty)}</td>
      <td class="cell center">${item.unit}</td>
      <td class="cell right">${rupiah(Number(item.unitPrice))}</td>
      <td class="cell right">${rupiah(Number(item.qty) * Number(item.unitPrice))}</td>
    </tr>`
    )
    .join("");

  const notesHtml = invoice.notes
    ? invoice.notes.split("\n").filter(Boolean).map((n: string) => `<li>${n}</li>`).join("")
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 0 48px 90px; }
  .top-bar { position: relative; height: 14px; background: #14213d; margin: 0 -48px 32px; overflow: hidden; }
  .top-bar::after { content: ""; position: absolute; top: 0; right: 0; height: 100%; width: 52%; background: #7dd3fc; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .logo-img { max-height: 56px; max-width: 140px; object-fit: contain; }
  .company-name { font-size: 20px; font-weight: 700; color: #14213d; letter-spacing: 0.5px; }
  .tagline { font-size: 10px; color: #1d4ed8; letter-spacing: 1px; font-weight: 600; }
  .invoice-title { font-size: 38px; font-weight: 800; color: #14213d; text-align: right; letter-spacing: 1px; }

  .meta-section { display: flex; margin-bottom: 28px; }
  .meta-left { flex: 1; padding-right: 24px; }
  .meta-divider { width: 1px; background: #e2e8f0; margin: 0 24px; }
  .meta-right { flex: 1; }
  .info-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #334155; margin-bottom: 7px; }
  .info-row svg { margin-top: 2px; flex-shrink: 0; }
  .meta-table td { padding: 4px 0; font-size: 12px; }
  .meta-label { color: #64748b; font-weight: 600; padding-right: 20px; letter-spacing: 0.3px; }
  .meta-value { font-weight: 700; color: #1d4ed8; }

  .parties { display: flex; justify-content: space-between; margin: 26px 0; gap: 40px; }
  .party { flex: 1; }
  .party h4 { font-size: 10.5px; color: #1d4ed8; margin-bottom: 10px; letter-spacing: 0.8px; font-weight: 700; }
  .party .name { font-weight: 700; margin-bottom: 6px; font-size: 13px; }
  .party .line { font-size: 12px; color: #334155; margin-bottom: 6px; line-height: 1.4; }
  .party .info-row { margin-bottom: 6px; }

  table.items { width: 100%; border-collapse: collapse; margin-top: 8px; }
  table.items thead th { background: #14213d; color: white; font-size: 10.5px; text-transform: uppercase; padding: 11px 12px; text-align: left; letter-spacing: 0.4px; }
  table.items thead th.center { text-align: center; }
  table.items thead th.right { text-align: right; }
  .cell { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
  .cell.center { text-align: center; }
  .cell.right { text-align: right; }
  .item-title { font-weight: 600; }
  .item-sub { color: #64748b; font-size: 10px; margin-top: 3px; }

  .bottom-section { display: flex; justify-content: space-between; margin-top: 26px; gap: 40px; }
  .notes { flex: 1; font-size: 11px; color: #334155; }
  .notes h4 { font-size: 10.5px; color: #14213d; margin-bottom: 10px; letter-spacing: 0.5px; }
  .notes li { margin-bottom: 5px; list-style: disc; margin-left: 16px; }
  .summary { width: 280px; }
  .summary table { width: 100%; }
  .summary td { padding: 6px 0; font-size: 12px; color: #334155; }
  .summary td.right { text-align: right; font-weight: 600; }
  .summary .total-row td { font-weight: 800; font-size: 16px; color: #14213d; background: #dbeafe; padding: 12px 10px; }

  .footer-section { display: flex; justify-content: space-between; margin-top: 40px; align-items: flex-end; }
  .payment-box h4 { font-size: 10.5px; color: #14213d; margin-bottom: 12px; letter-spacing: 0.5px; }
  .bank-box { background: #f1f5f9; border-radius: 8px; padding: 14px 16px; }
  .bank-list { display: flex; flex-direction: column; gap: 10px; }
  .bank-item { display: flex; gap: 10px; align-items: center; }
  .bank-item .bank-name { font-weight: 700; font-size: 11.5px; margin-bottom: 3px; }
  .bank-item .bank-detail { font-size: 11px; color: #334155; line-height: 1.5; }
  .signature-block { text-align: center; width: 200px; }
  .signature-block h4 { font-size: 10.5px; color: #14213d; margin-bottom: 12px; letter-spacing: 0.5px; }
  .signature-line { border-bottom: 1px solid #94a3b8; height: 56px; margin-bottom: 8px; }
  .signature-name { font-size: 12px; font-weight: 700; color: #14213d; }
  .signature-caption { font-size: 10px; color: #64748b; }

  .print-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 34px; background: #14213d; display: flex; align-items: center; justify-content: center; }
  .print-footer span { color: #ffffffcc; font-size: 11px; font-style: italic; }

  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 90px; font-weight: 800; color: rgba(20, 33, 61, 0.12); letter-spacing: 4px; white-space: nowrap; z-index: 9999; pointer-events: none; }
</style>
</head>
<body>
  <div class="top-bar"></div>

  <div class="header">
    <div class="header-left">
      ${logoDataUri ? `<img class="logo-img" src="${logoDataUri}" />` : ""}
      <div>
        <div class="company-name">${invoice.company.name}</div>
        ${invoice.company.tagline ? `<div class="tagline">${invoice.company.tagline}</div>` : ""}
      </div>
    </div>
    <div class="invoice-title">INVOICE</div>
  </div>

  <div class="meta-section">
    <div class="meta-left">
      ${invoice.company.address ? `<div class="info-row">${icons.pin}<span>${invoice.company.address}</span></div>` : ""}
      ${invoice.company.phone ? `<div class="info-row">${icons.phone}<span>${invoice.company.phone}</span></div>` : ""}
      ${invoice.company.email ? `<div class="info-row">${icons.mail}<span>${invoice.company.email}</span></div>` : ""}
      ${invoice.company.website ? `<div class="info-row">${icons.globe}<span>${invoice.company.website}</span></div>` : ""}
      ${invoice.company.npwp ? `<div class="info-row">${icons.doc}<span>NPWP: ${invoice.company.npwp}</span></div>` : ""}
    </div>
    <div class="meta-divider"></div>
    <div class="meta-right">
      <table class="meta-table">
        <tr><td class="meta-label">INVOICE NO.</td><td class="meta-value">${invoice.invoiceNo}</td></tr>
        <tr><td class="meta-label">INVOICE DATE</td><td>${tanggal(invoice.invoiceDate)}</td></tr>
        <tr><td class="meta-label">DUE DATE</td><td>${tanggal(invoice.dueDate)}</td></tr>
        <tr><td class="meta-label">CURRENCY</td><td>${invoice.currency}</td></tr>
      </table>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h4>BILL TO</h4>
      <div class="name">${invoice.client.name}</div>
      ${invoice.client.address ? `<div class="line">${invoice.client.address}</div>` : ""}
      ${invoice.client.picName ? `<div class="info-row">${icons.user}<span>${invoice.client.picName}</span></div>` : ""}
      ${invoice.client.phone ? `<div class="info-row">${icons.phone}<span>${invoice.client.phone}</span></div>` : ""}
      ${invoice.client.email ? `<div class="info-row">${icons.mail}<span>${invoice.client.email}</span></div>` : ""}
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:6%">NO.</th>
        <th>DESCRIPTION</th>
        <th class="center" style="width:8%">QTY</th>
        <th class="center" style="width:12%">UNIT</th>
        <th class="right" style="width:16%">UNIT PRICE</th>
        <th class="right" style="width:16%">TOTAL</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="bottom-section">
    <div class="notes">
      ${notesHtml ? `<h4>NOTES</h4><ul>${notesHtml}</ul>` : ""}
    </div>
    <div class="summary">
      <table>
        <tr><td>SUBTOTAL</td><td class="right">${rupiah(subtotal)}</td></tr>
        <tr><td>DISCOUNT ${Number(invoice.discountPercent)}%</td><td class="right">-${rupiah(discount)}</td></tr>
        <tr><td>PPN ${Number(invoice.taxPercent)}%</td><td class="right">${rupiah(tax)}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td class="right">${rupiah(total)}</td></tr>
      </table>
    </div>
  </div>

  ${banks.length ? `
  <div class="footer-section">
    <div class="payment-box">
      <h4>PAYMENT INFORMATION</h4>
      <div class="bank-list">
        ${banks.map((b: any) => `
        <div class="bank-box">
          <div class="bank-item">
            ${icons.bank}
            <div>
              <div class="bank-name">${b.bankName}</div>
              <div class="bank-detail">${b.accountNumber}<br/>a.n ${b.accountName}</div>
            </div>
          </div>
        </div>`).join("")}
      </div>
    </div>
    <div class="signature-block">
      <h4>AUTHORIZED BY</h4>
      <div class="signature-line"></div>
      ${invoice.company.signerName
        ? `<div class="signature-name">${invoice.company.signerName}</div>
           ${invoice.company.signerTitle ? `<div class="signature-caption">${invoice.company.signerTitle}</div>` : ""}`
        : `<div class="signature-caption">Tanda tangan &amp; stempel</div>`}
    </div>
  </div>` : ""}

  ${showWatermark ? `<div class="watermark">MARCINVOICE</div>` : ""}

  <div class="print-footer"><span>Thank you for your business!</span></div>
</body>
</html>`;
}
