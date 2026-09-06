"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Printer, X, Download, ShieldCheck, Wifi, Sparkles } from "lucide-react";

interface PrintableQrStandModalProps {
  merchant: {
    id: string;
    name: string;
    masterName: string;
    craftTitle?: string;
    category?: string;
    district: string;
    city: string;
    slug: string;
    verifiedYear?: number | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintableQrStandModal({
  merchant,
  isOpen,
  onClose,
}: PrintableQrStandModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (merchant) {
      const publicUrl = `https://esnafca.com/esnaf/${merchant.slug}`;
      QRCode.toDataURL(publicUrl, {
        margin: 1,
        width: 600,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => null);
    }
  }, [merchant]);

  if (!isOpen || !merchant) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Fiziki Pleksi Stand & Masaüstü Vektör Kartı
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {merchant.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır (A6 / 10x15cm)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Stand Container (High-Res Acrylic Vector Card) */}
        <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div
            ref={printAreaRef}
            id="printable-acrylic-stand"
            className="w-[320px] h-[480px] bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between relative border border-slate-700/60 overflow-hidden"
            style={{ printColorAdjust: "exact" }}
          >
            {/* Glossy Acrylic Corner Highlights */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand & Badge */}
            <div className="w-full flex flex-col items-center text-center space-y-1 z-10">
              <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Doğrulanmış Mahalle Esnafı</span>
              </div>

              <div className="pt-2">
                <span className="text-xl font-black tracking-tight text-white block truncate max-w-[270px]">
                  {merchant.name}
                </span>
                <span className="text-xs font-medium text-slate-300 block">
                  {merchant.masterName} · {merchant.district} / {merchant.city}
                </span>
              </div>
            </div>

            {/* Center QR Code on Glossy White Plate */}
            <div className="my-auto z-10 flex flex-col items-center space-y-2">
              <div className="p-3.5 bg-white rounded-2xl shadow-xl border-2 border-slate-100/30 flex items-center justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Esnaf Menü QR"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                    QR Üretiliyor...
                  </div>
                )}
              </div>

              {/* NFC & Scan Callout */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-300 pt-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
                <span>Kameranızı Tutun veya Dokundurun</span>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="w-full text-center border-t border-slate-700/60 pt-3 z-10">
              <div className="text-[11px] font-extrabold text-blue-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Şeffaf Fiyat Menüsü & Randevu</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                esnafca.com/esnaf/{merchant.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 print:hidden">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">
            Baskı & Lojistik Notu:
          </span>
          <p>
            Bu şablon standart A6 (105 × 148 mm) dikey pleksi T-stand veya L-stand yuvalarına 1:1 tam uyumludur. 300 DPI kuşe çıkartma kağıdına yazdırılarak dükkan tezgahına yerleştirilir.
          </p>
        </div>
      </div>

      {/* Embedded Print Isolation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 0;
          }
          body {
            visibility: hidden !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-acrylic-stand, #printable-acrylic-stand * {
            visibility: visible !important;
          }
          #printable-acrylic-stand {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 105mm !important;
            height: 148mm !important;
            max-width: 105mm !important;
            max-height: 148mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 999999 !important;
          }
        }
      `}} />
    </div>
  );
}
