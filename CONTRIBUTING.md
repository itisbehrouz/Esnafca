# Contributing to Esnafça

Thank you for your interest in contributing to Esnafça. This document explains our guidelines and development workflow.

---

## Code of Conduct

All contributors must follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We expect respectful communication across all project channels.

---

## Development Workflow

### 1. Prerequisites

Before you start, install these tools on your system:
- Node.js 20 or higher
- npm 10 or higher (or Bun 1.1 or higher)
- Docker and Docker Compose (or a local PostgreSQL instance)
- Git

### 2. Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork to your local machine:
   ```bash
   git clone https://github.com/<your-username>/achord-store.git esnafca
   cd esnafca
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/itisbehrouz/achord-store.git
   ```

### 3. Install Dependencies

Install project dependencies:
```bash
npm install
```

### 4. Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the local PostgreSQL database:
   ```bash
   docker compose up -d
   ```
3. Apply the Prisma database schema:
   ```bash
   npx prisma db push
   ```
4. Seed the database with sample data:
   ```bash
   npm run seed
   npm run seed:boost
   ```

### 5. Run the Application

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3005](http://localhost:3005) in your web browser.

---

## Testing and Verification

You must run tests before you submit code:

1. Check code style and lint rules:
   ```bash
   npm run lint
   ```
2. Run automated test suites:
   ```bash
   npm test
   ```
3. Run all 6 automated test suites:
   ```bash
   npm run test:suites
   ```
4. Build the production application:
   ```bash
   npm run build
   ```

All checks must pass without errors.

---

## Pull Request Guidelines

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Write clear and focused commits using Conventional Commits syntax:
   - `feat: add new feature`
   - `fix: resolve specific bug`
   - `docs: update documentation`
   - `test: add verification tests`
3. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a pull request against the `main` branch.
5. Complete all checklist items in the pull request template.

---

## Questions and Support

For questions or security concerns, contact `contact@achord.io`.
