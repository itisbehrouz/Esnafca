"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Grid, Store, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: "/",
      label: "Keşfet",
      icon: Compass,
      isActive: mounted ? pathname === "/" : false,
    },
    {
      href: "/kategoriler",
      label: "Kategoriler",
      icon: Grid,
      isActive: mounted ? pathname?.startsWith("/kategoriler") : false,
    },
    {
      href: "/dukkanim",
      label: "Dükkanım",
      icon: Store,
      isActive: mounted ? pathname?.startsWith("/dukkanim") : false,
    },
    {
      href: "/esnaf-ekle",
      label: "Esnaf Ol",
      icon: PlusCircle,
      isActive: mounted ? pathname?.startsWith("/esnaf-ekle") : false,
      highlight: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/[0.08] shadow-[0_-2px_12px_rgba(0,0,0,0.03)] sm:hidden pb-safe">
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 text-zinc-400 transition-colors ios-press",
                item.isActive && "text-brand font-bold",
                item.highlight && "text-brand"
              )}
            >
              <Icon className={cn("w-5 h-5 stroke-[1.8]", item.isActive && "stroke-[2.3]")} />
              <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
