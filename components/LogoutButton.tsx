"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-slate-500 hover:text-red-600 transition-colors border border-slate-200 rounded-md px-3 py-2"
    >
      Keluar
    </button>
  );
}
