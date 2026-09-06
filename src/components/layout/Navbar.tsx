"use client";

import Link from "next/link";
import { Plus, Store, ShieldCheck, Map as MapIcon, LayoutGrid } from "lucide-react";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavbarProps {
  viewMode?: "map" | "list";
  onViewModeChange?: (mode: "map" | "list") => void;
}

export function Navbar({ viewMode, onViewModeChange }: NavbarProps) {
  return (
    <header
      className="shrink-0 sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b-[0.5px] border-black/10 dark:border-white/10 transition-colors duration-200 pt-safe"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand Monogram */}
        <Link href="/" className="flex items-center gap-2.5 ios-press">
          <EsnafcaLogo size={32} variant="full" />
        </Link>

        {/* Center: View Switcher Segmented Control (if supported on page) */}
        {viewMode && onViewModeChange && (
          <div className="flex items-center p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]">
            <button
              type="button"
              onClick={() => onViewModeChange("map")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ios-press ${
                viewMode === "map"
                  ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Harita</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ios-press ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#1C1C1E] text-black dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Desktop-only quick links */}
          <Link
            href="/dukkanim"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold ios-press"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Dükkanım</span>
          </Link>

          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold ios-press"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Yönetici</span>
          </Link>

          {/* Theme Switcher (Mobile + Desktop) */}
          <ThemeToggle />

          {/* Desktop-only Dükkan Ekle CTA button (Mobile uses BottomNav "Esnaf Ol") */}
          <Link
            href="/esnaf-ekle"
            className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 ios-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dükkan Ekle</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
