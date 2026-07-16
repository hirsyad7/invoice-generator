# Marc Invoice Generator

Web app generator invoice: register/login, isi profil perusahaan (nama, logo, beberapa rekening bank), buat invoice dengan item dinamis, export ke PDF profesional, plus sistem role admin dan paket Free/Pro.

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL (Supabase) + Prisma ORM
- NextAuth (Credentials/email-password)
- Tailwind CSS
- Puppeteer (generate PDF)

## Fitur

### Untuk user
- Daftar & login
- Profil perusahaan: nama, tagline, logo (upload file), alamat, kontak, NPWP, nama & jabatan penandatangan, dan **beberapa rekening bank sekaligus**
- Buat invoice dengan item dinamis, diskon, pajak, catatan
- Setiap invoice **membekukan snapshot data perusahaan** saat dibuat — jadi kalau profil diedit belakangan, invoice lama tetap menampilkan data seperti saat diterbitkan
- Download invoice sebagai PDF (desain profesional lengkap dengan header, tabel item, ringkasan, info pembayaran, area tanda tangan)
- Hapus invoice

### Paket Free vs Pro
- **Free** (default semua user baru): PDF invoice ada watermark "MARCINVOICE" besar transparan
- **Pro**: PDF bersih tanpa watermark
- Upgrade ke Pro dilakukan manual — user hubungi WhatsApp **081222070669**, biaya Rp30.000, lalu admin yang mengaktifkan paket Pro-nya lewat halaman admin
- Banner ajakan upgrade otomatis muncul di dashboard & halaman invoice untuk user Free

### Untuk admin
- Halaman `/admin` (hanya bisa diakses role admin): lihat semua user, jumlah invoice per user
- Reset password user (bukan melihat password lama — password di-hash satu arah, tidak bisa dilihat siapa pun termasuk admin)
- Ubah plan user (Free ↔ Pro)
- Hapus user (beserta seluruh data company/invoice miliknya)

### Lain-lain
- Setiap `npm run dev` di-restart, semua sesi login yang aktif otomatis diminta login ulang (berguna untuk development, supaya sesi selalu "fresh")

## 1. Prasyarat
- Node.js 18+
- Project Supabase (PostgreSQL) — lihat bagian "Setup Supabase" di bawah

## 2. Install dependencies

```bash
npm install
```

Kalau muncul warning `allow-scripts` untuk Prisma/Puppeteer, jalankan:
```bash
npm approve-scripts @prisma/client
npm approve-scripts @prisma/engines
npm approve-scripts prisma
npm approve-scripts puppeteer
npm install
```

## 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **Project Settings → Database → Connection string**, pilih tab **Direct connection** (port 5432)
3. Copy connection string-nya, ganti `[YOUR-PASSWORD]` dengan password database kamu

## 4. Environment variables

```bash
cp .env.example .env
```

Isi `.env`:
```
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
NEXTAUTH_SECRET="hasil dari: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
NEXTAUTH_URL="http://localhost:3000"
```

## 5. Migrasi database

```bash
npx prisma migrate dev
```

Ini membuat semua tabel: User, CompanyProfile, BankAccount, Client, Invoice, InvoiceItem.

## 6. Buat folder upload logo

```bash
mkdir public\uploads
```
(folder ini menyimpan file logo yang diupload lewat halaman profil — hanya cocok untuk development lokal, lihat catatan di bagian "Yang masih bisa dikembangkan")

## 7. Jadikan akun kamu admin

1. Jalankan `npm run dev`, daftar akun pertama lewat `/register`
2. Jalankan:
   ```bash
   node scripts/make-admin.js email-kamu@gmail.com
   ```
3. Logout & login ulang — tombol **Admin** akan muncul di dashboard

## 8. Jalankan project

```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000).

## 9. Build untuk production

```bash
npm run build
npm run start
```

## 10. Catatan deploy ke Vercel (opsional)

Puppeteer versi penuh terlalu besar untuk serverless function. Ganti dulu:
```bash
npm uninstall puppeteer
npm install puppeteer-core @sparticuz/chromium
```
Di `app/api/invoices/[id]/pdf/route.ts`, ganti bagian launch browser:
```ts
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
```
Set environment variables yang sama di dashboard Vercel. Fitur upload logo ke folder lokal (`public/uploads`) juga perlu diganti ke object storage (Cloudflare R2/Supabase Storage) karena filesystem serverless bersifat sementara.

## Struktur folder penting

```
app/
  (auth)/login, (auth)/register       -> halaman auth (desain custom + branding)
  (dashboard)/dashboard                -> daftar invoice, preview perusahaan, banner upgrade
  (dashboard)/profile                  -> form profil perusahaan (multi rekening bank)
  (dashboard)/invoices/new             -> form buat invoice
  (dashboard)/invoices/[id]            -> detail invoice + download PDF + hapus
  admin                                -> kelola user (role admin only)
  api/auth/...                         -> NextAuth + register
  api/companies, api/clients           -> CRUD data pendukung
  api/invoices, api/invoices/[id]      -> CRUD invoice (snapshot company otomatis)
  api/invoices/[id]/pdf                -> generate PDF (watermark otomatis untuk plan Free)
  api/admin/users/...                  -> reset password, ubah plan, hapus user
lib/
  prisma.ts                            -> koneksi database
  auth.ts                              -> konfigurasi NextAuth (role, plan, session epoch)
  renderInvoiceHtml.ts                 -> template HTML untuk PDF
prisma/schema.prisma                   -> skema database
scripts/make-admin.js                  -> jadikan akun sebagai admin (jalankan manual sekali)
scripts/set-session-epoch.js           -> jalan otomatis tiap `npm run dev`, reset semua sesi login
```

## Yang masih bisa dikembangkan
- Upload logo & signature langsung ke object storage (bukan folder lokal)
- Auto-generate nomor invoice
- Status invoice (draft/sent/paid) belum ada UI untuk mengubahnya dari sisi user
- Pembayaran upgrade Pro masih manual (via WhatsApp) — bisa diintegrasikan payment gateway (Midtrans/Xendit) untuk otomatis
- Multi-currency belum dihitung otomatis kursnya