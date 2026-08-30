"use client";

import Link from "next/link";
import { Plus, Store, ShieldCheck } from "lucide-react";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.05]">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand Monogram */}
        <Link href="/" className="flex items-center gap-2.5 ios-press">
          <EsnafcaLogo size={32} variant="full" />
        </Link>

        {/* Desktop Quick Portals */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/dukkanim"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-zinc-600 hover:text-black hover:bg-black/[0.04] text-xs font-semibold ios-press"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Dükkanım</span>
          </Link>

          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-zinc-600 hover:text-black hover:bg-black/[0.04] text-xs font-semibold ios-press"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Yönetici</span>
          </Link>

          <Link
            href="/esnaf-ekle"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-bold shadow-xs hover:bg-zinc-800 ios-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dükkan Ekle</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
