"use client";

import { useState } from "react";
import { X, MessageCircle, Copy, Check, Share2 } from "lucide-react";
import { Merchant } from "@/types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant;
}

export function ShareModal({ isOpen, onClose, merchant }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = typeof window !== "undefined" ? `${window.location.origin}/esnaf/${merchant.slug}` : "";
  const shareMessage = `Mahallenin ustası: ${merchant.name} (${merchant.city} / ${merchant.district} - ${merchant.craftTitle}). Şeffaf fiyat menüsünü inceleyin: ${url}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 1200);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Apple Action Sheet */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] dark:border dark:border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-250 z-10">
        {/* Grabber on Mobile */}
        <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black dark:text-white">Ustayı Paylaş</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{merchant.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 ios-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Options */}
        <div className="space-y-2 pt-1">
          {/* WhatsApp Direct Share Button */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm ios-press transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>WhatsApp ile Komşuna / Eşine Gönder</span>
          </a>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="w-full p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-black dark:text-white font-bold text-xs flex items-center justify-center gap-2 ios-press transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span className="text-emerald-700 dark:text-emerald-300">Bağlantı Panoya Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <span>Dükkan Bağlantısını Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white ios-press"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
