import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

export const metadata: Metadata = {
  title: "Esnafça - Şeffaf Fiyat, Dürüst Usta, Mahallenin Esnafı",
  description: "Türkiye'nin küçük esnaf ve yerel zanaatkârlarını beyaz yakalılarla buluşturan komisyonsuz, şeffaf fiyat menülü mobil platform.",
  manifest: "/manifest.json",
  icons: {
    icon: "/apple-touch-icon.png",
    shortcut: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Esnafça",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased min-h-screen pb-20 sm:pb-8 flex flex-col bg-[#F2F2F7]" suppressHydrationWarning>
        <PwaInstallPrompt />
        <div className="flex-1 flex flex-col">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
