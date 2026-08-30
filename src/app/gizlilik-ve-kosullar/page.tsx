"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Scale, FileText, AlertCircle, MessageCircle } from "lucide-react";

export default function GizlilikVeKosullarPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 ios-blur border-b border-black/[0.06]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs font-bold text-brand ios-press p-1.5 -ml-2 rounded-full hover:bg-black/[0.04]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Ana Sayfa</span>
          </Link>
          <h1 className="font-extrabold text-sm text-black">
            Hukuki Şartlar & KVKK
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header Hero */}
        <div className="bg-white rounded-ios-card p-5 sm:p-6 border border-black/[0.04] shadow-ios-card space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Scale className="w-3.5 h-3.5" /> 5651 & 6698 Sayılı Kanunlara Uyum
          </div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">
            Esnafça Yasal Statü, KVKK ve Kullanım Koşulları
          </h2>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            Son Güncelleme: 30 Ağustos 2026 · Esnafça (esnafca.com)
          </p>
        </div>

        {/* Section 1: Hizmet Niteliği */}
        <div className="bg-white rounded-ios-card p-5 sm:p-6 border border-black/[0.04] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-black font-extrabold text-sm">
            <FileText className="w-4 h-4 text-brand" />
            <h3>1. Hizmetin Niteliği ve Yer Sağlayıcı Statüsü</h3>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Esnafça (<strong>esnafca.com</strong>), 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında bir elektronik ticaret pazaryeri veya aracı ödeme kuruluşu <strong>değildir</strong>.
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Esnafça, 5651 sayılı Kanun'un 5. maddesi uyarınca bir <strong>"Yer Sağlayıcı"</strong> ve yerel esnaf dizin rehberidir. Platform üzerinden doğrudan sipariş alınmaz, ödeme tahsil edilmez veya komisyon kesilmez. Kullanıcı ile esnaf arasındaki tüm iletişim ve iş akdi, tarafların kendi iradeleriyle WhatsApp veya yüz yüze iletişim kanalları üzerinden yürütülür.
          </p>
        </div>

        {/* Section 2: Fiyat Politikası & Sorumluluk Reddi */}
        <div className="bg-white rounded-ios-card p-5 sm:p-6 border border-black/[0.04] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-black font-extrabold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3>2. Fiyat Bilgileri ve Sorumluluk Reddi (Disclaimer)</h3>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Esnaf profillerinde yer alan fiyat menüleri, ilgili esnaf/zanaatkâr tarafından beyan edilen veya piyasa ortalamalarına dayanan <strong>gösterge niteliğinde tahmini fiyat aralıklarıdır</strong>.
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Kullanılan malzeme, ürünün yıpranma durumu veya ek işçilik gereksinimlerine göre nihai fiyat esnaf tarafından müşteriye iş öncesinde bildirilir. Esnafça, esnaf ile müşteri arasındaki fiyat uyuşmazlıklarından veya işçilik kalitesinden sorumlu tutulamaz.
          </p>
        </div>

        {/* Section 3: KVKK Aydınlatma Metni */}
        <div className="bg-white rounded-ios-card p-5 sm:p-6 border border-black/[0.04] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-black font-extrabold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3>3. KVKK Aydınlatma Metni (Esnaf ve Ziyaretçi Hakları)</h3>
          </div>
          <div className="space-y-2 text-xs text-zinc-600 font-medium leading-relaxed">
            <p>
              <strong>a) Ziyaretçi / Kullanıcı Verileri:</strong> Esnafça, son kullanıcılardan (müşterilerden) profil inceleme veya esnafa ulaşma aşamasında zorunlu üyelik, telefon, kimlik veya konum kaydı <strong>talep etmez ve saklamaz</strong>.
            </p>
            <p>
              <strong>b) Esnaf / İşletme Verileri:</strong> Esnafın kamuya açık iş yeri adı, adresi, telefon numarası ve mesleki uzmanlıkları; esnafın kendi kaydı (KVKK m. 5/2-c) veya ticari işletmenin kamuya alenileştirdiği bilgiler (KVKK m. 5/2-d) kapsamında sadece dizin listelemesi amacıyla işlenir.
            </p>
          </div>
        </div>

        {/* Section 4: Uyar-Kaldır Hakkı */}
        <div className="bg-white rounded-ios-card p-5 sm:p-6 border border-black/[0.04] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-black font-extrabold text-sm">
            <Scale className="w-4 h-4 text-purple-600" />
            <h3>4. Uyar-Kaldır (Notice & Takedown) Prosedürü</h3>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            Dükkanınızın bilgilerini güncellemek, sahiplenmek veya Esnafça dizininden tamamen kaldırılmasını talep etmek için dükkan profilindeki *"Bu Dükkan Benim"* butonunu kullanabilir veya doğrudan destek hattımıza başvurabilirsiniz. Talebiniz en geç 24 saat içinde işleme alınır.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/905321112233?text=Selam%20Esnaf%C3%A7a%20Hukuk%20Ekibi%2C%20d%C3%BCkkan%20bilgilerim%20hakk%C4%B1nda%20talepte%20bulunmak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold transition-all ios-press"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hukuk & Kaldırma Destek Hattı</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
