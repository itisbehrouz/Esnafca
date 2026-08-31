import React from "react";

interface EsnafcaLogoProps {
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "icon" | "full";
}

export function EsnafcaLogo({ size = 32, className = "", variant = "icon" }: EsnafcaLogoProps) {
  const pixelSize = typeof size === "number"
    ? size
    : size === "sm"
    ? 24
    : size === "md"
    ? 48
    : size === "lg"
    ? 64
    : size === "xl"
    ? 80
    : 32;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/apple-touch-icon.png"
        alt="Esnafça Logo"
        width={pixelSize}
        height={pixelSize}
        style={{ width: pixelSize, height: pixelSize }}
        className="rounded-[22%] object-cover shadow-xs shrink-0"
      />

      {variant === "full" && (
        <span className="font-extrabold text-base tracking-tight text-black dark:text-white leading-none">
          Esnaf<span className="text-brand">ça</span>
        </span>
      )}
    </div>
  );
}
