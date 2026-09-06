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
      <div className={`w-9 h-9 rounded-xl border border-transparent ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";
  const tooltipText = isDark ? "Aydınlık Moda Geç" : "Karanlık Moda Geç";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`h-9 px-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98] ${className}`}
        title={tooltipText}
        aria-label={tooltipText}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-blue-400" />
        )}
        <span>{isDark ? "Aydınlık" : "Koyu"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600 transition-all cursor-pointer shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-blue-400" />
      )}
    </button>
  );
}
