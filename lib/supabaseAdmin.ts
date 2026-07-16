import { createClient } from "@supabase/supabase-js";

// Client khusus server-side untuk upload file ke Supabase Storage.
// Pakai service role key (bukan anon key) karena ini dipanggil dari API route,
// bukan dari browser, jadi aman menyimpan kredensial dengan hak akses penuh.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
