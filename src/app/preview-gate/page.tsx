"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LockKeyhole, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { verifySitePasswordAction } from "@/app/actions/preview-auth";
import { EsnafcaLogo } from "@/components/brand/EsnafcaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function PreviewGateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectParam = searchParams.get("redirect") || "/";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      triggerShake("Lütfen erişim şifresini girin.");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await verifySitePasswordAction(password, redirectParam);
        if (res.success && res.redirectUrl) {
          router.push(res.redirectUrl);
          router.refresh();
        } else {
          triggerShake(res.error || "Geçersiz erişim şifresi.");
        }
      } catch {
        triggerShake("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      }
    });
  };

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#F2F2F7] dark:bg-black transition-colors duration-300">
      {/* Top Bar with Logo & Theme Toggle */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <EsnafcaLogo size="sm" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
            Preview
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Ambient Lighting Gradients */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand/20 dark:bg-brand/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Lock Card */}
      <div
        className={`relative z-10 w-full max-w-[400px] rounded-[32px] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-7 sm:p-9 transition-all duration-300 ${
          isShaking ? "animate-shake border-rose-500/50 ring-2 ring-rose-500/20" : ""
        }`}
      >
        <div className="text-center space-y-3">
          {/* Lock Icon with Pulse */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand flex items-center justify-center shadow-xs">
              <LockKeyhole className="w-7 h-7 stroke-[2.2] animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-brand/20 blur-sm -z-10 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              Önizleme Erişimi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Esnafça şu anda geliştirme aşamasındadır. Devam etmek için erişim şifresini girin.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="preview-password"
              className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block px-1"
            >
              Giriş Şifresi
            </label>

            <div className="relative flex items-center">
              <input
                id="preview-password"
                type={showPassword ? "text" : "password"}
                autoFocus
                required
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Erişim şifresi"
                className="w-full text-sm font-semibold text-black dark:text-white bg-zinc-100/90 dark:bg-zinc-800/90 py-3.5 pl-4 pr-11 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-zinc-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !password.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ios-press transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Subtle Security Badge */}
        <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Uçtan Uca Şifrelenmiş Özel Önizleme</span>
        </div>
      </div>
    </main>
  );
}

export default function PreviewGatePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </main>
      }
    >
      <PreviewGateContent />
    </Suspense>
  );
}
