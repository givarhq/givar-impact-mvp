# Givar Impact Platform

[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black)](https://nextjs.org/)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E)](https://nestjs.com/)
[![Database: Prisma](https://img.shields.io/badge/Database-Prisma-2D3748)](https://www.prisma.io/)
[![Monorepo: Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444)](https://turbo.build/)

Givar is a high-transparency philanthropy protocol designed to bridge the trust gap between donors and community projects. It features a forensic-grade ledger, milestone-based funding tranches, and a robust project proposal pipeline.

## Non-Custodial Architecture Notice
Givar operates on a **strictly non-custodial, direct-payment model**. The platform does not hold user funds in escrow or act as a digital wallet. All capital flows directly from the donor's payment method (via Paystack) to the verified vendor's bank account for specific project execution phases. 

*(Note for developers: While you will see modules named `Wallet` or `WalletTransaction` in the codebase, these function purely as internal ledger routing nodes for double-entry accounting and mathematical integrity, not as user-held balances).*

## Operational Overview
- Money never moves without a strict ledger transaction and audit log. 
- Admin impersonation is strictly read-only. 
- Funds are only disbursed via verified execution milestones. 
- All sensitive documents are private by default and time-limited. 
- Production secrets are not stored in code or repos.

## Repository Structure (Monorepo)
This project is managed as a **Turborepo Monorepo**. This allows for shared TypeScript interfaces and configurations across the stack. Detailed documentation for each segment can be found in their respective directories:

```text
.
├── apps
│   ├── web/                # Next.js 16 Frontend (See apps/web/README.md)
│   └── api/                # NestJS Backend (See apps/api/README.md)
├── packages
│   ├── database/           # Prisma Schema & Seeds (See packages/database/README.md)
│   ├── types/              # Shared TypeScript Interfaces & DTOs
│   └── config/             # Shared Tailwind, ESLint, and TS configs
├── package.json            # Workspace-wide dependencies
└── turbo.json              # Build pipeline configuration
```

## Tech Stack & Infrastructure
- **Frontend:** Next.js 16.1.1 (App Router), React 19, Tailwind CSS, Framer Motion, Zustand (State), TanStack Query.
- **Backend:** NestJS 10 (Modular Architecture), Passport.js (JWT & Refresh Strategy), otplib (2FA).
- **ORM:** Prisma 7.2.0 (Type-safe client generation with Postgres Adapter).
- **Database:** Neon (PostgreSQL with Serverless adapter and connection pooling).
- **Storage:** iDrive e2 (S3-compatible) for encrypted KYC and evidence storage.
- **Payments:** Paystack (Zonal payment processing & Webhook logic).
- **Communication:** Resend (Transactional emails with dynamic React-based templates).
- **Observability:** Sentry (Forensic error tracking & session replay).

## Getting Started (Development)

### 1. Environment Configuration
The system relies on local environment variables. **Do not commit `.env` files.**
- Create `apps/api/.env` from `apps/api/.env.example`.
- Create `apps/web/.env.local` from `apps/web/.env.example`.
- Create `packages/database/.env` from `.env.example`.

### 2. Dependency Orchestration
Givar uses `pnpm` for workspace management.
```bash
# Install all dependencies across the monorepo
pnpm install
```

### 3. Running the App
For database initialization and seeding, please refer to `packages/database/README.md`.
```bash
# Start only API service
pnpm dev:api

# Start only Web service
pnpm dev:web

# Start both API and Web in development mode
pnpm dev
```

## Global Coding Standards
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `chore:`).
- **Formatting:** Prettier and ESLint are enforced at the root level. Run `pnpm lint` before pushing code.

## Deployment & CI/CD
- **Frontend:** Deployed on **Vercel**.
- **Backend:** Deployed on **Render** (Web Service).
- **Database:** Managed via **Neon** (PostgreSQL).

### Deployment Checklist
1. Verify `DATABASE_URL` uses the pooled connection for Render.
2. Ensure `PAYSTACK_SECRET_KEY` and Webhook URL are set in the production dashboard.
3. Verify `FRONTEND_URL` in the backend matches the Vercel production URL for CORS.

## Known Limitations & Technical Debt
- **Full-Text Search:** Currently relies on Prisma `ILIKE` filters. As the database grows, a migration to **Postgres Full Text Search** or **Algolia** is recommended.
- **Webhook Idempotency:** While the Paystack webhook handler checks for existing transactions using references, adding a Redis-based idempotency layer would further harden the system.
- **Media Optimization:** Images are served directly via presigned URLs from iDrive e2. Implementation of a CDN (like Cloudflare) would improve global latency.

## Security & Support
For access to production service accounts (Vercel, Render, Paystack, Neon), refer to the **Private Handover Document** provided to the Project Owner. Always rotate API keys if they are accidentally logged or exposed in the client-side bundle.