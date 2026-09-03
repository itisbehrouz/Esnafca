import Link from "next/link";
import { 
  ChevronLeft, 
  Scissors, 
  Sparkles, 
  Car, 
  KeyRound, 
  Dog, 
  Hammer, 
  ChevronRight 
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
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

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-24 text-black dark:text-white transition-colors duration-200">
      {/* Apple Translucent Header */}
      <div className="sticky top-0 z-30 ios-blur dark:bg-black/80 border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
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
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-black dark:text-white tracking-tight">
            Tüm Hizmet Alanları & Zanaatlar
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            İhtiyacınız olan kategoriyi seçerek mahallenizdeki doğrulanmış şeffaf fiyatlı ustalara ulaşın.
          </p>
        </div>

        {/* Apple Inset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                  <span className="inline-block text-[10px] font-bold text-brand pt-0.5">
                    {count} Usta Listelendi
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
