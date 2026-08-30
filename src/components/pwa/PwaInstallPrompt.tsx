"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registration error:", err);
      });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("esnafca_pwa_dismissed");
      if (!dismissed) {
        setShow(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!mounted || !show) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("esnafca_pwa_dismissed", "true");
  };

  return (
    <div className="fixed top-16 left-4 right-4 z-40 max-w-md mx-auto bg-black/90 text-white p-3.5 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-top backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Esnafça'yı Ana Ekrana Ekleyin</h4>
          <p className="text-[11px] text-zinc-400">Tek dokunuşla yerel uygulama gibi kullanın.</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center gap-1 shadow-sm ios-press"
        >
          <Download className="w-3.5 h-3.5" /> Yükle
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white ios-press"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
