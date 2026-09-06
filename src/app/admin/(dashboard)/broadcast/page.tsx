"use client";

import React, { useState } from "react";
import { 
  Send, 
  MessageCircle, 
  Check, 
  Copy, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { sendBroadcastAction } from "@/app/actions/admin";

const TEMPLATES = [
  {
    title: "Fiyat Tarifesi Güncelleme",
    text: "Değerli Esnafımız, mahallenizdeki tüketicilere şeffaf hizmet sunabilmeniz için lütfen Esnafça panelinizden güncel fiyat tarifenizi kontrol ediniz. Bol kazançlar dileriz!",
  },
  {
    title: "Bayram & Yoğunluk Bildirisi",
    text: "Değerli Usta, yaklaşan bayram öncesinde müşteri yoğunluğunuzu daha rahat yönetebilmek adına WhatsApp randevu saatlerinizi güncellemenizi rica ederiz.",
  },
  {
    title: "Dükkan Vitrin Fotoğrafı Ekleme",
    text: "Sayın Esnafımız, dükkan vitrininize yeni fotoğraflar ekleyerek mahalle sıralamasında daha üst sıralara çıkabilir ve müşteri güvenini artırabilirsiniz.",
  },
  {
    title: "Pro & Plus Ayrıcalıkları",
    text: "Değerli Esnafımız, Esnafça Pro paketine geçerek aramalarda öne çıkabilir ve doğrudan WhatsApp randevu taleplerinizi %300 artırabilirsiniz.",
  },
];

export default function BroadcastPage() {
  const [targetGroup, setTargetGroup] = useState("all");
  const [broadcastText, setBroadcastText] = useState(TEMPLATES[0].text);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    showToast("Duyuru metni panoya kopyalandı!");
  };

  const handleSendBroadcast = async () => {
    setIsSending(true);
    setResult(null);
    try {
      const res = await sendBroadcastAction(targetGroup, broadcastText, channel);
      if (res.success) {
        setResult(res);
        showToast(`Toplu duyuru ${res.recipientCount} esnafa başarıyla iletildi ve denetim kütüğüne işlendi.`);
      } else {
        showToast("Hata: " + res.error);
      }
    } catch {
      showToast("Gönderim başarısız.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Toplu WhatsApp & SMS Duyuru Masası
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aktif ustalara toplu fiyat güncelleme, kampanya ve operasyonel duyurular gönderin.
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-center">
          Korumalı İletişim Hattı
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Message Editor & Targeting (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
            {/* Target Group Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Hedef Alıcı Kitlesi</span>
              </label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Aktif Esnaflar (Platform Geneli)</option>
                <option value="pro">Sadece Pro ve Plus Aboneler</option>
                <option value="plus">Yalnızca Usta Plus Aboneleri</option>
                <option value="district:Kadıköy">Kadıköy Bölgesi Esnafları</option>
                <option value="district:Beşiktaş">Beşiktaş Bölgesi Esnafları</option>
                <option value="district:Çankaya">Ankara / Çankaya Esnafları</option>
                <option value="district:Konak">İzmir / Konak Esnafları</option>
              </select>
            </div>

            {/* Channel Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                İletişim Kanalı
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    channel === "whatsapp"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp Business API / Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    channel === "sms"
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Send className="w-4 h-4 text-blue-500" />
                  <span>SMS Başlıklı Mesaj</span>
                </button>
              </div>
            </div>

            {/* Ready Templates */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Hazır Operasyon Şablonları</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBroadcastText(tmpl.text)}
                    className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <span className="block font-bold truncate text-[11px]">{tmpl.title}</span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      {tmpl.text.slice(0, 35)}...
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Duyuru Metni
                </label>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {broadcastText.length} Karakter
                </span>
              </div>
              <textarea
                rows={5}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? "Panoya Kopyalandı!" : "Metni Kopyala"}</span>
              </button>

              <button
                type="button"
                disabled={isSending || !broadcastText.trim()}
                onClick={handleSendBroadcast}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? "Gönderiliyor..." : "Toplu Duyuruyu Gönder"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Delivery Ledger (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Smartphone WhatsApp Message Mockup */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block pb-1">
              Alıcı Ekranı Canlı Önizlemesi
            </span>

            <div className="p-4 rounded-xl bg-[#EFEAE2] dark:bg-[#111B21] border border-slate-300 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  E
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Esnafça Destek & Operasyon
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#202C33] shadow-xs text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                {broadcastText || "Mesaj metnini yukarıdaki alana giriniz..."}
                <div className="text-[10px] font-mono text-slate-400 text-right mt-1.5">
                  12:00 ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Last Broadcast Result Log */}
          {result && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Duyuru Başarıyla İşlendi ({result.recipientCount} Esnaf)</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Denetim kütüğüne işlendi. Örnek alıcılar:
              </p>
              <div className="divide-y divide-emerald-200 dark:divide-emerald-800 text-[11px] font-mono">
                {result.sampleRecipients?.map((r: any) => (
                  <div key={r.id} className="py-1 flex items-center justify-between">
                    <span>{r.name}</span>
                    <a
                      href={`https://wa.me/90${(r.whatsapp || r.phone).replace(/\D/g, "").replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>{r.phone}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
