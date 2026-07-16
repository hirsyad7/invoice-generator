import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Simpan file yang diupload ke Supabase Storage (bucket "logos"), lalu
// kembalikan URL publiknya. Ini dipakai (bukan folder lokal) supaya tetap
// berfungsi setelah deploy ke Vercel, karena filesystem serverless bersifat
// sementara dan tidak cocok untuk menyimpan file secara permanen.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const filename = `${(session.user as any).id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("logos")
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: "Gagal upload logo: " + error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("logos").getPublicUrl(filename);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
