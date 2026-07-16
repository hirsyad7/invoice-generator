# Marc Invoice Generator

Web app generator invoice: register/login, isi profil perusahaan (nama, logo, beberapa rekening bank), buat invoice dengan item dinamis, export ke PDF profesional, plus sistem role admin dan paket Free/Pro. Sudah live di production (Vercel).

## Stack
- Next.js 14 (App Router) + TypeScript
- PostgreSQL (Supabase) + Prisma ORM
- NextAuth (Credentials/email-password)
- Tailwind CSS
- Puppeteer-core + Browserless.io (generate PDF di production)
- Supabase Storage (upload logo)

## Fitur

### Untuk user
- Daftar & login
- Profil perusahaan: nama, tagline, logo (upload file ke Supabase Storage), alamat, kontak, NPWP, nama & jabatan penandatangan, dan **beberapa rekening bank sekaligus**
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
- Node.js 20.x (versi ini dikunci lewat field `engines` di `package.json`)
- Project Supabase (PostgreSQL + Storage)
- Akun Browserless.io (buat generate PDF, ada free tier)

## 2. Install dependencies

```bash
npm install
```

Kalau muncul warning `allow-scripts` untuk Prisma, jalankan:
```bash
npm approve-scripts @prisma/client
npm approve-scripts @prisma/engines
npm approve-scripts prisma
npm install
```

## 3. Setup Supabase

**Database:**
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **Project Settings → Database → Connection string**
   - Untuk `.env` lokal: pakai tab **Direct connection** (port 5432) untuk `DATABASE_URL` maupun `DIRECT_URL`
   - Untuk production (Vercel): `DATABASE_URL` pakai **Transaction pooler** (port 6543, tambahkan `?pgbouncer=true` di akhir), `DIRECT_URL` tetap port 5432

**Storage (untuk upload logo):**
1. Buka menu **Storage**, klik **New bucket**, nama `logos`, centang **Public bucket**
2. Buka **Project Settings → API**, catat **Project URL** dan **service_role key**

## 4. Setup Browserless.io

1. Daftar di [browserless.io](https://www.browserless.io/), ambil API token dari dashboard

## 5. Environment variables

```bash
cp .env.example .env
```

Isi `.env`:
```
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
NEXTAUTH_SECRET="hasil dari: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
NEXTAUTH_URL="http://localhost:3000"
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
BROWSERLESS_TOKEN="..."
```

## 6. Migrasi database

```bash
npx prisma migrate dev
```

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

Catatan: di lokal, generate PDF pakai Chrome yang terinstall di komputer kamu (bukan Browserless) — pastikan Google Chrome sudah terinstall.

## Deploy ke Vercel

Project ini sudah live, tapi kalau perlu deploy ulang dari awal (misal fork/clone baru):

1. **Push ke GitHub**, lalu import project itu di [vercel.com](https://vercel.com) (Continue with GitHub)
2. Pilih plan **Hobby** (gratis)
3. Sebelum Deploy, isi semua **Environment Variables** yang sama seperti di `.env` — kecuali `DATABASE_URL` pakai versi **pooler** (port 6543) untuk production, dan `NEXTAUTH_URL` diisi placeholder dulu
4. **Settings → General → Node.js Version**, pastikan di-set ke **20.x**
5. Deploy, tunggu selesai
6. Setelah tahu URL production-nya, update `NEXTAUTH_URL` di Environment Variables ke URL asli itu, lalu **Redeploy**
7. Kalau mau ganti domain jadi lebih pendek: **Settings → Domains → Edit**

### Kenapa pakai Browserless.io, bukan bundling Chromium sendiri?
Awalnya proyek ini pakai `puppeteer-core` + `@sparticuz/chromium` (pola umum untuk PDF generation di serverless), tapi ternyata terus gagal di environment Vercel dengan error `libnss3.so: cannot open shared object file` — walau sudah dicoba beberapa perbaikan standar (upgrade versi, matikan graphics mode, kunci versi Node). Kemungkinan besar package itu punya inkompatibilitas spesifik dengan environment Vercel (awalnya dirancang untuk AWS Lambda). Solusi yang akhirnya berhasil: connect ke browser yang sudah berjalan di Browserless.io lewat WebSocket, bukan menjalankan Chromium sendiri di dalam function.

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
  api/invoices/[id]/pdf                -> generate PDF (Browserless di prod, Chrome lokal di dev)
  api/admin/users/...                  -> reset password, ubah plan, hapus user
  api/upload                           -> upload logo ke Supabase Storage
lib/
  prisma.ts                            -> koneksi database
  auth.ts                              -> konfigurasi NextAuth (role, plan, session epoch)
  renderInvoiceHtml.ts                 -> template HTML untuk PDF
  invoiceTotals.ts                     -> helper hitung subtotal/diskon/pajak/total
  supabaseAdmin.ts                     -> client Supabase Storage (server-side)
prisma/schema.prisma                   -> skema database
scripts/make-admin.js                  -> jadikan akun sebagai admin (jalankan manual sekali)
scripts/set-session-epoch.js           -> jalan otomatis tiap `npm run dev`, reset semua sesi login
```

## Yang masih bisa dikembangkan
- Auto-generate nomor invoice
- Status invoice (draft/sent/paid) belum ada UI untuk mengubahnya dari sisi user
- Pembayaran upgrade Pro masih manual (via WhatsApp) — bisa diintegrasikan payment gateway (Midtrans/Xendit) untuk otomatis
- Multi-currency belum dihitung otomatis kursnya