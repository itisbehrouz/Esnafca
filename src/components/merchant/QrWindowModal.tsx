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
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-sm text-stone-900">Dükkan Camı Karekod Kiti</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 bg-gradient-to-b from-esnaf-50 to-white" id="printable-kit">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Esnafça Doğrulanmış Mahalle Esnafı
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {merchant.name}
            </h2>
            <p className="text-xs font-semibold text-brand">
              {merchant.masterName} · {merchant.neighborhood}
            </p>
          </div>

          {/* QR Canvas */}
          <div className="flex justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-stone-300 shadow-inner max-w-xs mx-auto">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-stone-800">
              Kameranızla Okutun
            </p>
            <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
              Şeffaf fiyat listemizi görün, WhatsApp'tan doğrudan fiyat alın veya randevu isteyin.
            </p>
          </div>

          <div className="pt-2 text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            esnafca.com/{merchant.slug}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Vitrin Çıkartması Olarak Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}
