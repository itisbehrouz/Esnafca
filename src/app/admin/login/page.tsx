"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldAlert, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { loginAdminAction } from "@/app/actions/merchant";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col justify-between p-4 text-black dark:text-white transition-colors duration-200">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-4">
        <Link href="/" className="font-extrabold text-sm tracking-tight text-black dark:text-white flex items-center gap-1.5">
          <span>Esnafça</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold">
            Güvenli Giriş
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto py-6">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black mx-auto flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-black dark:text-white tracking-tight">
              Yönetici Kokpiti Girişi
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Bu alan sadece yetkili Esnafça yöneticileri içindir. Lütfen sistem şifrenizi giriniz.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block px-1">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] text-sm font-bold text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-98 disabled:opacity-50 text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 ios-press transition-all"
            >
              <span>{isLoading ? "Giriş Doğrulanıyor..." : "Panele Güvenli Bağlan"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              256-Bit JWT Korumalı
            </span>
            <Link href="/" className="hover:text-black dark:hover:text-white font-semibold">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="max-w-md w-full mx-auto text-center py-4">
        <p className="text-[11px] text-zinc-400 font-medium">
          Esnafça Digital Business Platform · Tüm Hakları Saklıdır
        </p>
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2F7] dark:bg-black" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
