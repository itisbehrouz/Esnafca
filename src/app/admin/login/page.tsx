"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";
import { loginAdminAction } from "@/app/actions/merchant";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = searchParams.get("from") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAdminAction(password);
      if (res.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(res.error || "Hatalı yönetici şifresi.");
      }
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 text-slate-900 dark:text-white transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto">
        <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Yönetici Kokpiti Girişi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Bu istasyon yetkili operatörler içindir. Lütfen sistem güvenlik anahtarınızı giriniz.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block px-1">
                Operatör Şifresi
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isLoading ? "Oturum Doğrulanıyor..." : "Panele Güvenli Bağlan"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Zero-Trust HS256 Korumalı
            </span>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white font-semibold text-xs">
              ← Vitrine Dön
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#020617]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
