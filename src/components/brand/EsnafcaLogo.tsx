import React from "react";

interface EsnafcaLogoProps {
  size?: number;
  className?: string;
  variant?: "icon" | "full";
}

export function EsnafcaLogo({ size = 32, className = "", variant = "icon" }: EsnafcaLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/apple-touch-icon.png"
        alt="Esnafça Logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-[22%] object-cover shadow-xs shrink-0"
      />

      {variant === "full" && (
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-black dark:text-white leading-none">
            Esnaf<span className="text-brand">ça</span>
          </span>
          <span className="text-[10px] font-bold bg-black/[0.05] dark:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full leading-none">
            Şeffaf
          </span>
        </div>
      )}
    </div>
  );
}
