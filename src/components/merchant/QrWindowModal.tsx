"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { X, Printer, ShieldCheck, QrCode } from "lucide-react";
import { Merchant } from "@/types";

interface QrWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
}

export function QrWindowModal({ isOpen, onClose, merchant }: QrWindowModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const pageUrl = `https://esnafca.com/esnaf/${merchant.slug}`;
      QRCode.toCanvas(canvasRef.current, pageUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: "#2A1810",
          light: "#FFFFFF",
        },
      });
    }
  }, [isOpen, merchant.slug]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-2xl border border-black/[0.06] dark:border-white/[0.1] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">Dükkan Camı Karekod Kiti</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 bg-gradient-to-b from-stone-50 to-white dark:from-zinc-900 dark:to-[#1C1C1E]" id="printable-kit">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Esnafça Doğrulanmış Mahalle Esnafı
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              {merchant.name}
            </h2>
            <p className="text-xs font-semibold text-brand">
              {merchant.masterName} · {merchant.neighborhood}
            </p>
          </div>

          {/* QR Canvas */}
          <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-stone-300 dark:border-zinc-700 shadow-inner max-w-xs mx-auto">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-stone-800 dark:text-zinc-200">
              Kameranızla Okutun
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 max-w-xs mx-auto">
              Şeffaf fiyat listemizi görün, WhatsApp&apos;tan doğrudan fiyat alın veya randevu isteyin.
            </p>
          </div>

          <div className="pt-2 text-[10px] font-bold tracking-widest text-stone-400 dark:text-zinc-500 uppercase">
            esnafca.com/{merchant.slug}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-900 border-t border-stone-200 dark:border-zinc-800 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Vitrin Çıkartması Olarak Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}
