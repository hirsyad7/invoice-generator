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

  // Di Vercel (serverless, Linux) pakai Chromium ringan dari @sparticuz/chromium.
  // Di lokal (development), pakai Chrome yang sudah terinstall di komputer kamu
  // (Puppeteer bisa menemukannya otomatis lewat opsi `channel: "chrome"`).
  const puppeteer = await import("puppeteer-core");
  const isDeployed = !!process.env.VERCEL;

  const browser = isDeployed
    ? await (async () => {
        const chromium = (await import("@sparticuz/chromium")).default;
        return puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      })()
    : await puppeteer.launch({ headless: true, channel: "chrome" });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  await browser.close();

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNo}.pdf"`,
    },
  });
}
