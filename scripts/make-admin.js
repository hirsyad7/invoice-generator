// Script sekali-jalan untuk menjadikan sebuah akun sebagai admin.
// Sengaja dibuat lewat terminal (bukan tombol di UI/API), supaya
// tidak ada celah orang lain bisa menaikkan role dirinya sendiri jadi admin.
//
// Cara pakai:
//   node scripts/make-admin.js email@kamu.com

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Pakai: node scripts/make-admin.js email@kamu.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`Berhasil! ${user.email} sekarang jadi admin.`);
}

main()
  .catch((e) => {
    console.error("Gagal:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());