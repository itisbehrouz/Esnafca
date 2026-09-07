# 🏪 Esnafça — Open-Source Local Commerce & Neighborhood Engine

> **Modern, full-stack platform for local merchants, neighborhood commerce, appointment booking, and interactive map discovery.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📖 Overview

**Esnafça** is a production-grade, open-source boilerplate designed to digitize local neighborhood commerce. It bridges the gap between residents and neighborhood artisans, small businesses, craftspeople, and local shops.

Instead of heavy corporate marketplace models, Esnafça provides a lean, hyper-local experience with zero vendor lock-in.

---

## ✨ Key Features

### 1. 📍 Interactive Neighborhood Discovery
* **Leaflet Map Integration:** Real-time geolocation, custom neighborhood boundaries, and category clustering.
* **Smart Filter & Search:** Search by neighborhood, distance, service type, or open hours.
* **Instant Direction & Call:** One-tap navigation via Apple/Google Maps and direct WhatsApp/Phone buttons.

### 2. 🏪 Merchant Digital Storefront (`/esnaf/[slug]`)
* Responsive profile cards with business hours, verified badges, and service menus.
* Dynamic QR Code generator for physical window stickers and table cards.
* Client reviews and rating system with moderation workflows.

### 3. 📅 Zero-Friction Appointment Booking
* Integrated booking engine for local services (barbers, tailors, repair shops, consultants).
* Automatic slot calculation and SMS/WhatsApp-ready notifications.

### 4. 📱 Merchant Self-Service Hub (`/dukkanim`)
* Dedicated lightweight dashboard for shop owners to manage catalog, operating hours, and appointments without complex training.

### 5. 🛡️ Zero-Trust Admin Operations HQ (`/admin`)
* **Real-time SSE:** Live stream of incoming merchant applications and customer appointments.
* **Multi-Role RBAC:** Super Admin, Operator, Compliance Auditor, and Logistics roles.
* **Audit Trail:** RFC 7807 compliant structured logging and immutable operational event tracking.

### 6. 💳 Pluggable Checkout & Payments
* Built-in Mock payment provider for rapid local development.
* Webhook architecture ready for iyzico, PayTR, or Stripe integrations.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, Edge Middleware) |
| **Frontend** | React 19, Tailwind CSS, Lucide Icons, Cmdk |
| **Maps & Geo** | Leaflet 1.9, OpenStreetMap tiles |
| **ORM & Database** | Prisma 6.x (PostgreSQL / Supabase / Neon / Local Docker) |
| **Security** | Jose JWT, HttpOnly cookies, RFC 7807 Problem Details |
| **Package Manager** | npm or Bun |

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/itisbehrouz/achord-store.git esnafca
cd esnafca
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

### 4. Start Local Database (Docker)
Start the PostgreSQL container:
```bash
docker compose up -d
```

### 5. Setup Database & Seed Data
Push the Prisma schema and populate sample data:
```bash
npx prisma db push
npm run seed
npm run seed:boost
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) in your web browser.

---

## 🧪 Testing & Verification

Run the test commands before opening a pull request:

```bash
# Run lint check
npm run lint

# Run automated boost verification suite (Phases 1-6)
npm test

# Run all integration suites
npm run test:all

# Verify production build
npm run build
```

---

## 📂 Project Structure

```text
├── .github/
│   ├── workflows/ci.yml    # Continuous Integration pipeline
│   └── ISSUE_TEMPLATE/     # Standard bug and feature templates
├── prisma/
│   ├── schema.prisma       # Database schema (Merchants, Services, Appointments, Staff)
│   └── seed.ts             # Demo data seeder
├── public/
│   └── uploads/            # Static assets and merchant images
├── scripts/
│   ├── seed-boost-data.ts  # Seed subscriptions, logistics, and staff data
│   └── test-boost-modules.ts # Full verification suite (Phases 1-6)
├── src/
│   ├── app/
│   │   ├── (public)/       # Neighborhood map, merchant directory, search
│   │   ├── esnaf/[slug]/   # Merchant public profile
│   │   ├── dukkanim/       # Merchant portal
│   │   ├── admin/          # Zero-Trust operations HQ (map, appointments, audit)
│   │   └── api/            # API route handlers (SSE, webhooks, payments)
│   ├── components/         # Reusable UI components & Leaflet map widgets
│   └── lib/                # Database clients, auth, problem-details error handler
├── CONTRIBUTING.md         # Contribution guidelines
├── CODE_OF_CONDUCT.md      # Community code of conduct
├── SECURITY.md             # Vulnerability reporting policy
└── DECISIONS.md            # Architectural Decision Records (ADR)
```

---

## 🛡️ Security & Zero-Trust Architecture

- **Isolated Admin Subdomain:** Ready for deployment behind Cloudflare Zero Trust (Access & Tunnels).
- **Edge Middleware:** Strict session validation with HttpOnly and SameSite cookie policies.
- **Problem Details (RFC 7807):** Standardized API error responses across all endpoints.
- Read our full [Security Policy](./SECURITY.md) to report vulnerabilities.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.  
Check the [issues page](https://github.com/itisbehrouz/achord-store/issues) for open tasks.

Please read our [Contributing Guidelines](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before you start.

1. Fork the project.
2. Create your feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a pull request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<p align="center">
  Crafted with care by <b>Behrouz Bagherzadeh</b> & <b>Achord Technologies</b>
</p>
