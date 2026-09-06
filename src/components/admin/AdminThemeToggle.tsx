"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface AdminThemeToggleProps {
  variant?: "icon" | "button" | "compact";
  className?: string;
}

export function AdminThemeToggle({
  variant = "icon",
  className = "",
}: AdminThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`p-2 rounded-xl border border-transparent ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";
  const tooltipText = isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`h-9 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98] ${className}`}
        title={tooltipText}
        aria-label={tooltipText}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-in spin-in-90 duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 animate-in spin-in-90 duration-200" />
        )}
        <span>{isDark ? "Aydınlık" : "Koyu"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-in spin-in-90 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 animate-in spin-in-90 duration-200" />
      )}
    </button>
  );
}
