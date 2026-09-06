import Link from "next/link";
import { 
  ChevronLeft, 
  Scissors, 
  Sparkles, 
  Car, 
  KeyRound, 
  Dog, 
  Hammer, 
  Zap,
  Bike,
  Shirt,
  Wrench,
  Footprints,
  ChevronRight 
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { MERCHANTS } from "@/data/seed-merchants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, any> = {
  Scissors,
  Sparkles,
  Car,
  KeyRound,
  Dog,
  Hammer,
  Zap,
  Bike,
  Shirt,
  Wrench,
  Footprints,
};

export default async function CategoriesPage() {
  let merchants: { category: string }[] = [];
  try {
    merchants = await prisma.merchant.findMany({
      select: { category: true },
    });
  } catch (error) {
    console.error("Error fetching merchants for categories page:", error);
  }

  if (merchants.length === 0) {
    merchants = MERCHANTS.map((m) => ({ category: m.category }));
  }

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-[#F2F2F7] dark:bg-black text-black dark:text-white transition-colors duration-200">
      {/* 1. Fixed Top Header */}
      <header
        className="shrink-0 z-40 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors pt-safe"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black dark:text-white">Zanaat Kategorileri</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* 2. Fixed Section Title & Description Block */}
      <div className="shrink-0 z-30 bg-[#F2F2F7]/95 dark:bg-black/95 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3.5 space-y-0.5">
          <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
            Tüm Hizmet Alanları & Zanaatlar
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            İhtiyacınız olan kategoriyi seçerek mahallenizdeki doğrulanmış şeffaf fiyatlı ustalara ulaşın.
          </p>
        </div>
      </div>

      {/* 3. Scrollable Categories Grid Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 pb-28 sm:pb-12 touch-pan-y">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Sparkles;
            const count = merchants.filter((m) => m.category === cat.id).length;

            return (
              <Link
                key={cat.id}
                href={`/?cat=${cat.id}`}
                className="p-4 rounded-ios-card bg-white dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.08] shadow-ios-card hover:shadow-md transition-all group flex items-start gap-3.5 ios-press"
              >
                <div className="w-11 h-11 rounded-ios bg-brand/10 text-brand flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-xs text-black dark:text-white group-hover:text-brand dark:group-hover:text-brand transition-colors">
                      {cat.name}
                    </h3>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-brand transition-colors" />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug font-medium line-clamp-2">
                    {cat.description}
                  </p>
                  <span className={`inline-block text-[10px] font-bold pt-0.5 ${
                    count > 0 ? "text-brand" : "text-zinc-400 dark:text-zinc-500 font-medium"
                  }`}>
                    {count > 0 ? `${count} Usta Listelendi` : "Henüz Usta Eklenmedi"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
