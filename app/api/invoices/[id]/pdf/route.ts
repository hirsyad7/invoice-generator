import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderInvoiceHtml } from "@/lib/renderInvoiceHtml";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, company: { userId: (session.user as any).id } },
    include: { items: true, client: true },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pakai snapshot yang dibekukan saat invoice dibuat, bukan data company yang
  // mungkin sudah berubah kalau profil diedit setelahnya.
  const invoiceForPdf = { ...invoice, company: invoice.companySnapshot as any };
  const showWatermark = (session.user as any).plan !== "pro";
  const html = await renderInvoiceHtml(invoiceForPdf, showWatermark);

  const puppeteer = await import("puppeteer-core");
  const isDeployed = !!process.env.VERCEL;

  // Di Vercel: connect ke browser yang sudah jalan di Browserless.io (bukan
  // menjalankan Chromium sendiri) — ini menghindari masalah ketidakcocokan
  // shared library antara @sparticuz/chromium dan environment Vercel yang
  // terus-menerus gagal walau sudah dicoba beberapa perbaikan standar.
  // Di lokal: tetap pakai Chrome yang sudah terinstall di komputer kamu.
  const browser = isDeployed
    ? await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
      })
    : await puppeteer.launch({ headless: true, channel: "chrome" });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  if (isDeployed) await browser.disconnect();
  else await browser.close();

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNo}.pdf"`,
    },
  });
}
