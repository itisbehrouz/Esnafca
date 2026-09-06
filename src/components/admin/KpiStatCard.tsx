import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface KpiStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  href?: string;
  accentColor?: "blue" | "amber" | "emerald" | "violet";
}

export function KpiStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  href,
  accentColor = "blue",
}: KpiStatCardProps) {
  const getAccentClasses = () => {
    switch (accentColor) {
      case "amber":
        return {
          iconBg: "bg-amber-500/10 text-amber-500",
          borderHover: "hover:border-amber-500/60",
          badge: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
        };
      case "emerald":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-500",
          borderHover: "hover:border-emerald-500/60",
          badge: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
        };
      case "violet":
        return {
          iconBg: "bg-indigo-500/10 text-indigo-500",
          borderHover: "hover:border-indigo-500/60",
          badge: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
        };
      case "blue":
      default:
        return {
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          borderHover: "hover:border-blue-500/60",
          badge: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
        };
    }
  };

  const style = getAccentClasses();

  const CardContent = (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs transition-all group active:scale-[0.99] flex flex-col justify-between ${style.borderHover}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${style.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>
          {trend && (
            <span
              className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full ${style.badge}`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>

      {href && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <span>Detayları İncele</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }

  return CardContent;
}
