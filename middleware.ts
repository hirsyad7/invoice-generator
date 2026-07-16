import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const role = (req.nextauth.token as any)?.role;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (!token) return false;
        // Kalau kode sesi di token gak cocok sama kode sesi terbaru
        // (server baru saja direstart lewat `npm run dev`), anggap
        // token ini sudah tidak valid dan minta user login ulang.
        return (token as any).sessionEpoch === process.env.SESSION_EPOCH;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/invoices/:path*", "/profile/:path*", "/admin/:path*"],
};
