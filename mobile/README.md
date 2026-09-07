# Esnafça Mobile — Flutter Client

> Mobile companion application for Esnafça, built with Flutter, Riverpod, and OpenStreetMap.

---

## Overview

The Esnafça Mobile application gives neighborhood residents and local artisans a mobile-first experience. It communicates with the Esnafça Next.js backend API.

---

## Features

- **Interactive Map:** Locate neighborhood merchants on OpenStreetMap with real-time GPS positioning.
- **Merchant Profiles:** View verified badges, craft specialties, business hours, and service menus.
- **Direct Contact:** Start WhatsApp chats or initiate phone calls with a single tap.
- **Online Booking:** Schedule appointments directly with local shops.
- **Merchant Hub (Dükkanım):** Shop owners can manage operating status, appointments, and QR codes.

---

## Tech Stack

| Component | Library |
| --- | --- |
| **Framework** | Flutter 3.x (Dart 3.x) |
| **State Management** | Flutter Riverpod 2.5 |
| **Networking** | Dio 5.4 |
| **Maps & Location** | flutter_map 6.1, latlong2, geolocator |
| **Security & Storage** | flutter_secure_storage |
| **Icons & Typography** | lucide_icons, google_fonts |

---

## Prerequisites

Install these tools on your computer before you start:
- Flutter SDK (version 3.0.0 or higher)
- Android Studio with Android SDK (for Android builds)
- Xcode (for iOS builds on macOS)

---

## Getting Started

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run the application in development mode:
   ```bash
   # Connect an emulator or physical device, then run:
   flutter run
   ```

4. Connect to a custom backend URL:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://localhost:3005/api
   ```

---

## Project Structure

```text
mobile/
├── lib/
│   ├── core/           # Theme, constants, network client, and utils
│   ├── models/         # Data models (Merchant, ServiceItem, Appointment)
│   ├── providers/      # Riverpod state providers
│   ├── screens/        # UI screens (Home map, Merchant detail, Dükkanım)
│   ├── services/       # API integration services
│   └── widgets/        # Reusable UI widgets and cards
└── test/               # Unit and widget test suites
```

---

## License

This project is part of the Esnafça open-source repository and is licensed under the [MIT License](../LICENSE).
