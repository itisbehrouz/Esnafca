<div align="center">

# ESNAFÇA

**Open-Source Local Commerce & Neighborhood Engine**

_Discover neighborhood artisans. Digitize local storefronts. Zero platform fees._

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 47 passed](https://img.shields.io/badge/Tests-47%20passed-success.svg)](#-automated-testing)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black.svg?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Maps: Leaflet](https://img.shields.io/badge/Maps-Leaflet%201.9-green.svg?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Zero Lock-in](https://img.shields.io/badge/Platform-Zero%20Commission-brightgreen.svg)](#-5-core-principles)

<br />

</div>

> **Esnafça** is a production-grade, open-source local commerce engine designed to digitize neighborhood merchants, artisans, and service providers. Instead of extractive marketplace commission models, it delivers a lean, hyper-local platform featuring interactive Leaflet map discovery, QR storefronts, zero-friction appointment booking, and a Zero-Trust operations dashboard.

---

### 🌍 The Hyper-Local Thesis

Traditional commerce marketplaces charge extractive commissions (15–30%) on local neighborhood businesses while locking their customer relationships behind proprietary walled gardens.

**Esnafça shifts power back to the neighborhood:**

- **Zero Intermediary Taxes:** Direct customer-to-merchant relationships with no hidden platform cuts.
- **Physical & Digital Convergence:** Window QR stickers bridge foot traffic to instant booking and catalogs.
- **Open Standards:** Built on standard web technologies with zero proprietary lock-in.

---

### ⚖️ 5 Core Principles

|   #   | Principle                              | Engineering Mandate                                                                 |
| :---: | :------------------------------------- | :---------------------------------------------------------------------------------- |
| **1** | **Local-First > Corporate Extraction** | Direct merchant contact and transparent pricing over commission toll-booths         |
| **2** | **Physical-First > Cloud Monopoly**    | Dynamic QR discovery and street-level Leaflet maps over remote ad feeds             |
| **3** | **Evidence > Fake Reviews**            | Verified appointment trails and authenticated feedback over unverified star farming |
| **4** | **Simplicity > Enterprise Bloat**      | Mobile-ready `/dukkanim` dashboard requiring zero software training for shop owners |
| **5** | **Zero-Trust > Implicit Access**       | RFC 7807 problem details, isolated `/admin` perimeter, and immutable audit logs     |

---

### 🏗️ Architecture & Core Engines

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Presentation Layer                            │
│  Public Map & Search (/)  │ Storefront (/esnaf/[slug]) │ Hub (/dukkanim)│
│  Zero-Trust Ops (/admin)  │ Mobile Flutter Client      │ QR Discovery   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                              Engine Layer                               │
│  - Leaflet Geo Engine (src/components/Map) - Booking & Slot Engine      │
│  - Real-Time SSE Stream (api/admin/sse)    - QR Code Generator          │
│  - RBAC Guard & Edge Middleware            - Audit Logging System       │
│  - Pluggable Payments (Mock / Webhooks)    - Merchant Verification      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                       Persistence & Security Data                       │
│  - Prisma 6 ORM Client (PostgreSQL / Supabase / Neon / Local Docker)    │
│  - Jose JWT Authentication & HttpOnly SameSite Session Cookies          │
│  - RFC 7807 Structured Problem Details Error Handling                   │
└─────────────────────────────────────────────────────────────────────────┘
```

| Engine / Module         | Core Path               | Purpose                                                                             |
| :---------------------- | :---------------------- | :---------------------------------------------------------------------------------- |
| **Interactive Map**     | `src/components/Map/`   | Real-time OpenStreetMap / Leaflet cluster map with geolocation and district filters |
| **Merchant Storefront** | `src/app/esnaf/[slug]/` | Public artisan profile, working hours, service menu, and appointment calendar       |
| **Merchant Hub**        | `src/app/dukkanim/`     | Self-service portal for artisans to manage bookings, services, and profile data     |
| **Zero-Trust Admin HQ** | `src/app/admin/`        | High-density control workstation with live SSE streams, metrics, and audit logs     |
| **Booking Scheduler**   | `src/lib/booking.ts`    | Slot calculation engine with double-booking prevention and status workflows         |
| **Mobile Companion**    | `mobile/`               | Flutter (Riverpod) mobile app for iOS and Android with map discovery                |

---

### ⚡ Quickstart

Get Esnafça running locally in under 3 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/itisbehrouz/Esnafca.git && cd Esnafca

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local PostgreSQL database via Docker
docker compose up -d

# 5. Push Prisma schema and seed baseline data
npx prisma db push
npm run seed
npm run seed:boost

# 6. Start development server
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your web browser.

---

### 🧭 Key Application Surfaces

```bash
# Public Surface
http://localhost:3005/             # Interactive map, district filter, neighborhood search
http://localhost:3005/esnaf/[slug] # Merchant storefront, services, and instant booking

# Merchant Self-Service
http://localhost:3005/dukkanim     # Store owner workstation for catalog and schedule

# Operations Headquarters
http://localhost:3005/admin        # Real-time telemetry, live SSE stream, audit logs
```

---

### 🛡️ Security & Zero-Trust Architecture

- **Edge Session Protection:** Authenticated cookies use `HttpOnly`, `Secure`, and `SameSite=Lax` flags validated at Next.js Edge Middleware.
- **RFC 7807 Error Contracts:** Standardized Problem Details responses across all `/api` endpoints for predictable client failure handling.
- **Multi-Role RBAC:** Role-based access control protecting administrative endpoints (`SUPER_ADMIN`, `OPERATOR`, `AUDITOR`).
- **Real-Time Telemetry:** Server-Sent Events (SSE) stream operational changes and merchant applications live to operators.

---

### 🧪 Automated Testing

Esnafça enforces automated testing across all business engines, data models, and concurrency limits:

```bash
# Run lint check
npm run lint

# Run automated verification suite (Phases 1-6)
npm test

# Run reviewer deep verification (concurrency, double-booking, and audit trails)
npm run test:reviewer

# Verify production build
npm run build
```

**Verification Results:**

- **47 Automated Test Cases** passing with 0 errors
- Concurrency & double-booking prevention verified
- Real-time audit log insertion verified
- District clustering and supply gap analytics verified

---

### 📂 Repository Structure

```text
├── .github/
│   ├── workflows/ci.yml     # Automated CI build and lint testing
│   └── ISSUE_TEMPLATE/      # Bug reports, feature requests, and blank issues
├── mobile/                  # Flutter iOS/Android mobile client with Riverpod
├── prisma/
│   ├── schema.prisma        # Complete relational schema (Merchants, Bookings, Staff, Logs)
│   └── seed.ts              # Baseline database seed script
├── public/
│   ├── llms.txt             # AI engine indexer and discovery metadata
│   └── uploads/             # Merchant imagery and store assets
├── scripts/
│   ├── test-boost-modules.ts # 47-point automated verification suite
│   ├── test-reviewer-deep-verification.ts # Security & concurrency audit
│   └── seed-boost-data.ts   # Advanced data seeder
├── src/
│   ├── app/
│   │   ├── (public)/        # Map discovery, directory, category search
│   │   ├── esnaf/[slug]/    # Public merchant profiles and booking flows
│   │   ├── dukkanim/        # Merchant self-service hub
│   │   ├── admin/           # Zero-Trust operations dashboard
│   │   └── api/             # API handlers (SSE, appointments, webhooks)
│   ├── components/          # Reusable UI widgets and Leaflet map components
│   └── lib/                 # Prisma client, auth tokens, error contracts
└── CONTRIBUTING.md          # Open-source contribution guide
```

---

### 🗺️ Product Roadmap

- [x] **Phase 1: Core Map & Geolocation:** Leaflet map clustering and district search.
- [x] **Phase 2: Merchant Storefronts:** Dynamic QR code generation, hours, and service menus.
- [x] **Phase 3: Zero-Friction Booking:** Slot scheduler with appointment status machine.
- [x] **Phase 4: Merchant Self-Service:** Mobile-ready `/dukkanim` catalog manager.
- [x] **Phase 5: Zero-Trust Operations HQ:** Live SSE dashboard and immutable audit logs.
- [x] **Phase 6: Mobile Client Companion:** Flutter cross-platform mobile app.
- [ ] **Phase 7: Webhooks & Multi-Gateway:** Direct iyzico, PayTR, and Stripe connectors.
- [ ] **Phase 8: Offline PWA Sync:** Service Worker caching for low-connectivity merchants.

---

### 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Check the [issues page](https://github.com/itisbehrouz/Esnafca/issues) for open tasks.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting pull requests.

---

### 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

<br />

<div align="center">
  <sub>Authored by <b>Behrouz Bagherzadeh</b> · Open-Source Neighborhood Commerce</sub>
</div>
