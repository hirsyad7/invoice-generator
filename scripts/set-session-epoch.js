// Dijalankan otomatis sebelum `npm run dev` (lewat hook "predev" di package.json).
// Menulis nilai acak baru ke .env.local setiap kali dev server dinyalakan,
// sehingga semua sesi login sebelumnya otomatis dianggap tidak valid
// dan user diwajibkan login ulang.

const fs = require("fs");
const path = require("path");

const envLocalPath = path.join(__dirname, "..", ".env.local");
const epoch = Date.now().toString();

let content = "";
if (fs.existsSync(envLocalPath)) {
  content = fs.readFileSync(envLocalPath, "utf-8");
}

const lines = content
  .split("\n")
  .filter((line) => line && !line.startsWith("SESSION_EPOCH="));

lines.push(`SESSION_EPOCH=${epoch}`);

fs.writeFileSync(envLocalPath, lines.join("\n") + "\n");
console.log("Sesi login direset — semua user akan diminta login ulang.");
