import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Esnafça - Şeffaf Fiyat, Dürüst Usta, Mahallenin Esnafı",
  applicationName: "Esnafça",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('esnafca_theme');
                var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen pb-20 sm:pb-8 flex flex-col bg-[#F2F2F7] dark:bg-black text-black dark:text-white transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <PwaInstallPrompt />
          <div className="flex-1 flex flex-col">{children}</div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
