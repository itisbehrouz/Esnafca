"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Karanlık Modu Değiştir"
        className={`p-2 rounded-full text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.08] transition-all ${className}`}
        disabled
      >
        <span className="w-4 h-4 block opacity-0" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
      title={isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
      className={`relative p-2 rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.12] bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.1] transition-all ios-press flex items-center justify-center shrink-0 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700 animate-in spin-in-90 duration-200" />
      )}
    </button>
  );
}
