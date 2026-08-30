import Link from "next/link";
import { Compass } from "lucide-react";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col items-center justify-center p-4 text-center text-black dark:text-white transition-colors duration-200">
      <div className="max-w-sm w-full bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex justify-center">
          <EsnafcaLogo size={48} variant="icon" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-brand uppercase tracking-wider">
            404 · Sayfa Bulunamadı
          </span>
          <h1 className="text-xl font-extrabold text-black dark:text-white tracking-tight">
            Aradığınız Usta veya Sayfa Taşınmış Olabilir
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
            Girdiğiniz bağlantı değişmiş veya dükkan kaydı güncellenmiş olabilir. Mahallenizdeki ustalara ana sayfadan ulaşabilirsiniz.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 ios-press shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            <Compass className="w-4 h-4" />
            <span>Mahalle Esnaflarını Keşfet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
