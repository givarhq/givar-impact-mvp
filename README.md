# Givar Impact Platform

[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black)](https://nextjs.org/)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E)](https://nestjs.com/)
[![Database: Prisma](https://img.shields.io/badge/Database-Prisma-2D3748)](https://www.prisma.io/)
[![Monorepo: Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444)](https://turbo.build/)

Givar is a high-transparency philanthropy protocol designed to bridge the trust gap between donors and community projects. It features a forensic-grade ledger, milestone-based funding tranches, and a robust project proposal pipeline.

---

## 🧭 Operational Overview (Non-Exhaustive) 
- Money never moves without a ledger transaction and audit log. 
- Admin impersonation is strictly read-only. 
- Funds are only released via verified milestones. 
- All sensitive documents are private by default and time-limited. 
- Production secrets are not stored in code or repos.

---

## 📂 Repository Structure (Monorepo)

This project is managed as a **Turborepo Monorepo**. This allows for shared TypeScript interfaces and configurations across the stack.

```text
.
├── apps
│   ├── web/                # Next.js 16 Frontend (React 19, Tailwind)
│   └── api/                # NestJS Backend (Ledger & Business Logic)
├── packages
│   ├── database/           # Prisma Schema, Migrations, and Centralized Client
│   ├── types/              # Shared TypeScript Interfaces & DTOs
│   └── config/             # Shared Tailwind, ESLint, and TS configs
├── package.json            # Workspace-wide dependencies
└── turbo.json              # Build pipeline configuration

```
---

## 👋 New Developer Starting Point

If you are new to the codebase: 
1. Read the **WalletModule** and **AuditModule** first to understand the financial invariants of the platform.
2. Review `packages/database/prisma/schema.prisma` to understand the domain model and relationship between Proposals and live Projects.
3. Run `pnpm db:seed` and explore the high-fidelity procedural data in Prisma Studio to see the ledger in action.
4. Use the Admin dashboard to observe the "Promotion" flow and how funds move through the Suspense Ledger.

---

## 🛠 Tech Stack & Infrastructure

### Core Frameworks
- **Frontend:** Next.js 16.1.1 (App Router), React 19, Tailwind CSS, Framer Motion, Zustand (State), TanStack Query.
- **Backend:** NestJS 10 (Modular Architecture), Passport.js (JWT & Refresh Strategy), otplib (2FA).
- **ORM:** Prisma 7.2.0 (Type-safe client generation with Postgres Adapter).

### External Services
- **Database:** Neon (PostgreSQL with Serverless adapter and connection pooling).
- **Storage:** iDrive e2 (S3-compatible) for encrypted KYC and evidence storage.
- **Payments:** Paystack (Zonal payment processing & Webhook logic).
- **Communication:** Resend (Transactional emails with dynamic React-based templates).

---

## 📐 High-Level Architecture & Technical Implementation

Givar is engineered with a **Domain-Driven Design (DDD)** approach within a modular monolith (NestJS) and a reactive frontend (Next.js).

---

## 📐 Architectural Boundaries 

- **Service-Oriented Logic:** All core business logic and financial calculations are strictly encapsulated in **Services**. Controllers are orchestration-only, handling DTO validation and response mapping.
- **Atomic Persistence:** Multi-entity writes (e.g., a Donation affecting a Project, a Wallet, and an Audit Log) must be wrapped in a single **Prisma Transaction** (`$transaction`) to ensure data consistency.
- **Financial Precision:** The backend serves as the only source of truth. It uses `BigInt` (Minor Units) for all arithmetic. The frontend provides visualization but must never "calculate" or "track" the definitive Wallet balance independently.
- **Optimistic Concurrency:** The `Wallet` model utilizes a `version` field. Architectural boundaries require that balance updates check this version to prevent race conditions during high-velocity donation spikes.
- **Serialization Safety:** Because JSON does not natively support `BigInt`, the API uses a global monkey-patch in `main.ts` (`BigInt.prototype.toJSON`). This ensures values are serialized as strings for the frontend to parse.

---

### 1. The Forensic Ledger Engine (`apps/api/src/modules/wallet`)
The heart of Givar is a "double-entry" style transaction ledger.
- **Atomic Operations:** All financial movements (donations, tranches, funding) are wrapped in `prisma.$transaction`. This ensures that a `Wallet` balance update never occurs without a corresponding `WalletTransaction` and `AuditLog` entry.
- **The "BigInt" Standard:** To eliminate floating-point rounding errors, Givar handles all currency in **Minor Units** (e.g., Kobo/Cents) using JavaScript `BigInt` and PostgreSQL `Numeric`.
- **Ledger Oversight:** Admins have a specialized `WalletRepository` access level for manual reconciliation and suspense resolution, forced through the `AuditLog` service.

### 2. Project Lifecycle & Promotion Pipeline (`apps/api/src/modules/project`)
The system follows a strict state machine to move from a user's idea to a verified, fundable project:
1.  **Draft Phase (`ProjectProposal`):** Initial data capture. No financial capabilities.
2.  **Verification Phase (`OrganizationProfile`):** The user submits KYC/Legal documents stored securely in iDrive e2. 
3.  **Promotion Logic:** Upon Admin approval, the `AdminService` triggers a promotion event. This creates a formal `Project` entity and bridges the `ProjectProposal` ID for historical traceability.
4.  **Milestone-Based Tranches:** Funds are locked in the `Project` raised amount and released via recorded `Disbursements` only upon Admin verification of `Milestone` completion.

### 3. The Security & Impersonation Layer (`apps/api/src/modules/auth`)
Givar implements a "Steel Gate" security architecture:
- **RBAC (Role-Based Access Control):** Custom `@Roles()` decorators and the `RolesGuard` manage access levels (`USER`, `ADMIN`, `SUPERADMIN`).
- **The ReadOnly Guard:** This is a mission-critical feature for support. 
    - When an Admin "impersonates" a user, a specialized JWT is issued with an `isImpersonating: true` claim.
    - The **Global `ReadOnlyGuard`** intercepts all incoming requests. If this claim is present, it permits `GET` requests but throws a `403 Forbidden` for any mutation attempt.

### 4. Media & Document Pipeline (`apps/api/src/modules/storage`)
Givar treats file security with the same priority as financial data:
- **S3 Key Management:** The database *never* stores public URLs for sensitive documents. It only stores the S3 Key.
- **Just-In-Time (JIT) Hydration:** The `StorageService` uses a hydration pattern. When a controller retrieves an entity, the service generates a **short-lived (15-minute) Presigned URL** from iDrive e2.

### 5. Donation Architecture & Suspense Routing (`apps/api/src/modules/donation`)
The donation engine is designed for high-concurrency and financial safety.
- **Funding Cap Protection:** Before processing, the service calculates `remainingNeeded`. If a donation exceeds this, the system triggers an `OVERFUNDING` exception.
- **Suspense Routing:** If funds are received for a project that is already `FUNDED`, `COMPLETED`, or missing, Givar routes the capital to the **Suspense Ledger** (`TxStatus.SUSPENSE`) for manual Admin re-allocation.
- **Guest Donation Logic:** Supports unauthenticated giving by creating a `GuestDonor` identity (unique by email) and linking a `GuestDonation` record.
- **Recurring Impact:** Uses a cron-ready state machine where the first charge is processed immediately to verify liquidity before setting the `nextChargeDate`.

### 6. Forensic Audit System (`apps/api/src/modules/audit`)
Givar maintains a platform-wide "Watchtower" that records every state mutation.
- **Contextual Tracking:** Every log captures the actor's IP address and User-Agent. Sensitive actions (e.g., `WALLET_DEBIT`, `PROJECT_DELETED`) are flagged for the 24h Security Summary.
- **Transactional Logging:** Audit logs are passed into Prisma transactions. If the business logic fails and rolls back, the audit log is never created, ensuring the log always matches the ground-truth state.

### 7. Organization & KYC State Machine (`apps/api/src/modules/organization`)
The verification pipeline manages the transition from individual givers to verified organizers.
- **State Convergence:** When an Admin verifies an organization, the `User.accountType` is upgraded to `ORGANIZER`, and any proposals in the `AWAITING_VERIFICATION` room are auto-promoted to `SUBMITTED`.
- **Identity Pinning:** Once verified, an organization’s `legalName` is pinned to all its projects, preventing identity swapping during active fundraising.

### 8. Transactional Email Infrastructure (`apps/api/src/modules/email`)
Givar utilizes Resend for all automated communications.
- **Asynchronous Dispatch:** Email calls use "Fire and Forget" logic (non-blocking) to ensure API performance.
- **Preference Filtering:** The service checks the `User.preferences` JSON. Users can granularly opt out of `donationReceipts` or `milestoneUpdates` while still receiving `securityAlerts`.

### 9. Proposal Lifecycle & Auto-Save (`apps/api/src/modules/proposal`)
The proposal module acts as a secure sandbox for future projects.
- **Debounced Auto-Save:** A specialized hook (`useProposalAutoSave`) detects changes in the frontend `Zustand` store and debounces updates to the backend.
- **Submission Gatekeeper:** Final submission requires a `coverImage`, a complete `budgetBreakdown`, and at least one `kycDocument`.

### 10. Giving Goals & Progress Engine (`apps/api/src/modules/goals`)
A specialized service for tracking donor impact.
- **Real-time Aggregation:** Percentage completion is calculated at runtime using `_sum` aggregates on all user donations within the goal's `startDate` and `endDate`.
- **Interval Upsert:** Maintains one `ACTIVE` goal per interval (`MONTHLY`/`YEARLY`) to prevent ledger clutter.

### 11. Frontend Reactive Architecture (`apps/web`)
- **Query Strategy:** Driven by `TanStack Query`, ensuring the UI and the Ledger stay in sync without manual page refreshes.
- **Shared Type Safety:** The Frontend imports Zod schemas and TypeScript interfaces directly from the shared packages (e.g., `packages/database`).
- **Global State:** Minimalist approach using `Zustand` for UI-only state (modals, auto-save buffers, and search states).

---

## 🛠 Project Structure Detail

### `packages/database` (The Single Source of Truth)
Contains the `schema.prisma` and the centralized database client. All other apps depend on this for data consistency.

### `apps/api` (The Engine)
- **`src/modules`**: Core logic (Donations, Projects, Users, Audit, Wallet).
- **`src/common`**: Shared decorators (Roles, Public), Guards (ReadOnly, Roles), and the Prisma Service.
- **`src/providers`**: Integrations for Paystack, Resend, and S3 Storage.

### `apps/web` (The Experience)
- **`/app`**: Next.js App Router (Admin, Auth, Dashboard, and Public routes).
- **`/components`**: Divided into `ui` (primitives) and `features` (complex components like `LedgerOversight` or `VerificationWizard`).
- **`/hooks`**: Custom hooks like `useProposalAutoSave`.
- **`/stores`**: Zustand stores for state management.

---

## 🚫 Invariants (Do Not Violate)
- **Supporting Transactions:** Never update a `Wallet` balance without a corresponding `WalletTransaction` and `AuditLog` entry.
- **Audit Compulsion:** Never bypass the `AuditService` for state mutations. Every change must be traceable to an actor.
- **Private Asset Security:** Never store or serve public URLs for KYC or legal documents. Assets must remain in the `/private/` S3 path and be accessed via short-lived (15-min) presigned URLs.
- **Impersonation Lock:** Never permit `POST`, `PATCH`, or `DELETE` requests while an admin is impersonating a user. This is enforced by the platform-wide `ReadOnlyGuard`.
- **Idempotency:** Always use the Paystack reference as a unique constraint in the ledger to prevent duplicate processing of the same financial event.

---

## 🏗 Workflow

### Adding a New Financial Feature
1.  **Schema:** Add the transaction type to `AuditAction` and `TxStatus`/`TxType` in `schema.prisma`.
2.  **Service:** Implement logic in `WalletService` or `DonationService`. **Always** use `this.prisma.$transaction`.
3.  **Audit:** Ensure `this.audit.log()` is called within the transaction.
4.  **UI:** Use the `SmartCurrency` component in the frontend (handles BigInt formatting).

### Extending the Admin Dashboard
1.  **Controller:** Add the endpoint in `AdminController`.
2.  **Guard:** Ensure `@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)` is applied.
3.  **Frontend:** Add the view in `apps/web/app/(admin)`. Use `AdminDataTable` and `ConfirmModal` for consistency.

***

### 📝 Final Note for Developers
This system is built for **forensic integrity**. If you are tasked with changing how money moves through the platform, your first point of reference must be the `WalletModule` and `WalletRepository`. Never modify balances directly; always create a supporting transaction record.

---

## 🚀 Getting Started (Development)

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

### 3. Database Setup
Ensure your local or Neon PostgreSQL instance is running and the `DATABASE_URL` is configured.
```bash
# Generate the Prisma Client
pnpm db:generate

# Sync the schema with your database
pnpm db:push

# Open Prisma Studio to inspect the data
pnpm db:studio
```

### 4. Database Seeding (Forensic Simulation)

The Givar platform utilizes a procedural seeding engine to generate a high-fidelity development environment. This simulation is designed to test the platform’s **Forensic Integrity**, **Ledger Stability**, and **Administrative Workflows** by mirroring real-world philanthropic activity.

---

#### 1. Seeding Strategy & Workflow
The seed script follows a strict relational dependency order to ensure data integrity:
1.  **Purge:** Atomic deletion of all existing records across the ledger.
2.  **Taxonomy:** Creation of system-wide `Category` nodes (Water, Education, etc.).
3.  **Identity:** Generation of `User` nodes (Admins, Organizers, and Donors).
4.  **KYC:** Initialization of `OrganizationProfiles` with forensic document keys.
5.  **Financial Nodes:** Lazy-loading of `Wallets` with initial capital injections.
6.  **Pipeline Simulation:** Moving entities from `ProjectProposal` (Draft) to live `Project` status.
7.  **Liquidity Velocity:** Generating a 30-day history of `WalletTransactions` and `Donations`.
8.  **Audit Trace:** Every event above generates a corresponding `AuditLog` entry.

---

#### 2. How to Initialize the Simulation

**To Clear and Re-seed the Database:**
Navigate to the root directory and run the workspace-aliased command:
```bash
pnpm db:seed
```

---

#### 3. Schema Models Seeded
The script targets the following models defined in `schema.prisma`:

| Model | Forensic Data Generated |
| :--- | :--- |
| **`User`** | System Admins, verified Organizers, and procedural Donor identities. |
| **`OrganizationProfile`** | Legal entity metadata and S3-compatible document keys. |
| **`Category`** | 10 industry-standard project sectors. |
| **`ProjectProposal`** | Drafts, submissions, and rejected states for pipeline testing. |
| **`Project`** | Live, active, and funded projects with execution timelines. |
| **`Wallet`** | Multi-currency balance snapshots (NGN, USD, GBP). |
| **`WalletTransaction`** | The immutable ledger: Credits, Debits, and Suspense entries. |
| **`Donation`** | Historical donor-to-project links. |
| **`Disbursement`** | Treasury outflows to vendors for specific milestones. |
| **`MilestoneProof`** | User-submitted evidence (images/descriptions) for verification. |
| **`AuditLog`** | Full session and mutation history with IP/User-Agent metadata. |

---

#### 4. The Seed Logic (Reference)
The core logic resides in `packages/database/prisma/seed.ts`. Key developer functions include:

*   **`prisma.model.deleteMany({})`**: Used at the start of the script to perform a clean-slate purge of the database.
*   **Procedural Math**: Uses `BigInt` for all financial generations to maintain precision.
*   **Temporal Distribution**: Uses `date-fns` to distribute donations across a 30-day window, populating the administrative analytics charts.
*   **State Machine Matching**: Ensures `ProjectProposals` marked as `APPROVED` have a corresponding `Project` record with matching `proposalId` for traceability.

---
**Developer Note:** If you modify the `schema.prisma`, you must run `pnpm db:generate` before re-running the seed to ensure the Prisma Client has the latest types for the seeding engine.

### 5. Running the App
```bash
# Start only API service
pnpm dev:api

# Start only Web service
pnpm dev:web

# Start both API and Web in development mode
pnpm dev
```

---

## 🔄 Development Workflow

### Database Migrations
When changing the schema in `packages/database/prisma/schema.prisma`:
1. Run `pnpm db:push` (for rapid dev) or `pnpm db:migrate` (for formal migrations).
2. This updates the local schema and generates the types for both `apps/api` and `apps/web`.

### API Documentation
The API is self-documenting via its NestJS modules. Refer to the controllers for available endpoints and their required DTOs.

### Coding Standards
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `chore:`).
- **Formatting:** Prettier and ESLint are enforced at the root level. Run `pnpm lint` before pushing code.

---

## 📦 Deployment & CI/CD

### Production Environments
- **Frontend:** Deployed on **Vercel**.
- **Backend:** Deployed on **Render** (Web Service).
- **Database:** Managed via **Neon** (PostgreSQL).

### Deployment Checklist
1. Verify `DATABASE_URL` uses the pooled connection for Render.
2. Ensure `PAYSTACK_SECRET_KEY` and Webhook URL are set in the production dashboard.
3. Verify `FRONTEND_URL` in the backend matches the Vercel production URL for CORS.

---

## ⚠️ Known Limitations & Technical Debt

- **Full-Text Search:** Currently relies on Prisma `ILIKE` filters. As the database grows, a migration to **Postgres Full Text Search** or **Algolia** is recommended.
- **Webhook Idempotency:** While the Paystack webhook handler checks for existing transactions using references, adding a Redis-based idempotency layer would further harden the system.
- **Media Optimization:** Images are served directly via presigned URLs from iDrive e2. Implementation of a CDN (like Cloudflare) would improve global latency.

---

## 🛡 Security & Support
For access to production service accounts (Vercel, Render, Paystack, Neon), refer to the **Private Handover Document** provided to the Project Owner.

**Critical Note:** Always rotate API keys if they are accidentally logged or exposed in the client-side bundle.

---
© 2026 Givar Impact Platform. All Rights Reserved.