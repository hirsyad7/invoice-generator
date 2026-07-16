import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Invoice Generator",
  description: "Buat invoice profesional dengan cepat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
