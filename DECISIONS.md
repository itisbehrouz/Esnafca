# 🏛️ Esnafça — Mimari ve Güvenlik Kararları (Architectural Decisions)

## Karar No: 2026/04 — Şirket Kontrol Paneli Domain Ayrımı ve Zero-Trust İzolasyonu

* **Tarih:** 2026-09-06
* **Durum:** `Kabul Edildi (Canlıya Çıkış Önkoşulu)`
* **İlgili Birimler:** Yönetim Kurulu, Siber Güvenlik Birimi (SecOps), Yazılım Mimarisi

### 1. Bağlam ve Problem Tanımı
Esnafça platformunda tüketici vitrini (`esnafca.com`) ile şirket yönetim paneli (`/admin`) geliştirme aşamasında aynı Next.js 15 projesi altında barındırılmaktadır.

Ancak canlı üretim (production) ortamında aynı köken (Same-Origin) altında admin paneli çalıştırmak şu kritik riskleri doğurur:
1. **Same-Origin Blast Radius (XSS Tehdidi):** Vitrinde (yorumlar, dükkan açıklamaları, 3. parti scriptler) oluşabilecek olası bir XSS açığı, aynı origin üzerinde çalıştığı için yetkili operatörlerin tarayıcısından admin API'lerine (`/api/admin/...`) otomatik yetkili istekler gönderebilir.
2. **Bot Taramaları & Brute Force:** Kamu internetindeki otomatik botlar bilinen domainlerin `/admin` uçlarını tarayarak şifre denemeleri yapar ve sunucuya gereksiz yük bindirir.
3. **Trafik & DDoS İzolasyonu Eksikliği:** Vitrinin aşırı trafik veya saldırı altında kalması durumunda şirket operasyon paneline erişim kesilebilir.

### 2. Alınan Karar ve Uygulama Hükmü
1. **Geliştirme / Test Ortamı (Mevcut Durum):**
   - Kod tabanında `/admin` modüler yapısı (`src/app/admin/`) Next.js Edge Middleware ve `HttpOnly` oturum koruması ile test edilmeye devam edilecektir.
2. **Canlıya (Production) Geçiş:**
   - Şirket kontrol paneli ana domainden kesin olarak izole edilecek; **`hq.esnafca.com`** (veya `admin.esnafca.com`) bağımsız subdomainine taşınacaktır.
   - Panel kamu internetine doğrudan açılmayacaktır; **Cloudflare Zero Trust (Access & Tunnels)** arkasına kilitlenecektir.
   - Panele yalnızca yetkili kurumsal e-postalar (`@achord.io`) ve biyometrik FIDO2 Passkey doğrulaması ile erişilecektir. Dışarıdan hiç kimse giriş formunu dahi göremeyecektir.
