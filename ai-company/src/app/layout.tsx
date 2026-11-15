import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AI Company OS", description: "AI company management console", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b0c0e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh font-sans text-[15px] leading-relaxed">{children}</body>
    </html>
  );
}
