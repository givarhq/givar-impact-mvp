# Givar API Service

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
```

### 2. API Backend Documentation
This file extracts all architectural, routing, and ledger rules to serve backend engineers.

```markdown
# apps/api/README.md
# Givar API Engine

The backend of Givar is engineered with a **Domain-Driven Design (DDD)** approach within a modular monolith (NestJS). It serves as the single source of truth for the platform's non-custodial ledger, discovery engine, and verification pipelines.

## New Developer Starting Point
1. Read the `WalletModule` (Internal Ledger) and `AuditModule` first to understand the financial invariants of the platform.
2. Review the `DonationModule` to understand how direct payments are captured and routed without user balances.
3. Observe the "Promotion" flow inside `ProposalService` to understand how a draft becomes a live cause.

## Architectural Boundaries 
- **Service-Oriented Logic:** All core business logic and financial calculations are strictly encapsulated in **Services**. Controllers are orchestration-only, handling DTO validation and response mapping.
- **Atomic Persistence:** Multi-entity writes (e.g., a Donation affecting a Project, an Internal Ledger Node, and an Audit Log) must be wrapped in a single **Prisma Transaction** (`$transaction`) to ensure data consistency.
- **Financial Precision:** The backend serves as the only source of truth. It uses `BigInt` (Minor Units) for all arithmetic to eliminate floating-point errors. 
- **Serialization Safety:** Because JSON does not natively support `BigInt`, the API uses a global monkey-patch in `main.ts` (`BigInt.prototype.toJSON`). This ensures values are serialized as strings for the frontend to parse.

## Core Modules & Technical Implementation

### 1. The Forensic Ledger Engine (`src/modules/wallet`)
The heart of Givar is a "triple-entry" style transaction ledger mapped via internal routing nodes.
- **Atomic Operations:** All financial movements (donations, fees, tranches) are wrapped in `prisma.$transaction`.
- **Triple-Entry Flow:** A direct checkout triggers simultaneous ledger events: 
  1. **Donor Record:** Funds are captured directly from the payment gateway.
  2. **Project Credit:** `raisedAmount` increases on the active project phase.
  3. **Treasury Credit:** Platform fees and tips are routed to a designated system node (`REV-` reference).
- **Ledger Oversight:** Admins have specialized access for manual reconciliation and suspense resolution, forced through the `AuditLog` service.

### 2. Transaction Fee Governance (`src/modules/fee`)
The platform utilizes an immutable, append-only rule engine for financial governance.
- **Append-Only Logic:** Fee rules are never updated in place. Old rules are archived (`isActive: false`) and a new rule is inserted to preserve historical financial context.
- **Financial Snapshots:** Every `Donation` and `GuestDonation` stores a forensic snapshot of the `feePercentage`, `feeAmount`, and `tipAmount` at the exact moment of transaction. This prevents historical drift if global rates change later.
- **Governance Security:** Modifying the global fee rate requires **Step-Up Authentication** (SuperAdmin password re-entry) to authorize the ledger mutation.

### 3. Project Lifecycle & Promotion Pipeline (`src/modules/project`)
The system follows a strict state machine to move from a user's idea to a verified, fundable project:
1.  **Draft Phase (`ProjectProposal`):** Initial data capture. No financial capabilities.
2.  **Verification Phase (`OrganizationProfile`):** The user submits KYC/Legal documents stored securely in iDrive e2. 
3.  **Promotion Logic:** Upon Admin approval, the `AdminService` triggers a promotion event. This creates a formal `Project` entity and bridges the `ProjectProposal` ID for historical traceability.
4.  **Milestone-Based Tranches:** Funds are targeted to active phases and released via recorded `Disbursements` directly to vendors only upon Admin verification of `Milestone` completion.

### 4. The Security & Impersonation Layer (`src/modules/auth`)
Givar implements a "Steel Gate" security architecture:
- **RBAC (Role-Based Access Control):** Custom `@Roles()` decorators and the `RolesGuard` manage access levels (`USER`, `ADMIN`, `SUPERADMIN`).
- **The ReadOnly Guard:** This is a mission-critical feature for support. 
    - When an Admin "impersonates" a user, a specialized JWT is issued with an `isImpersonating: true` claim.
    - The **Global `ReadOnlyGuard`** intercepts all incoming requests. If this claim is present, it permits `GET` requests but throws a `403 Forbidden` for any mutation attempt.

### 5. Media & Document Pipeline (`src/modules/storage`)
Givar treats file security with the same priority as financial data:
- **S3 Key Management:** The database *never* stores public URLs for sensitive documents. It only stores the S3 Key.
- **Just-In-Time (JIT) Hydration:** The `StorageService` uses a hydration pattern. When a controller retrieves an entity, the service generates a **short-lived (15-minute) Presigned URL** from iDrive e2.

### 6. Donation Architecture & Suspense Routing (`src/modules/donation`)
The donation engine is designed for high-concurrency and non-custodial safety.
- **Direct Checkout Integration:** Donations are routed instantly from the gateway to the active project phase without touching intermediary user balances.
- **Phase Cap Protection:** Before processing, the service calculates the exact limit of the current execution phase. If a donation exceeds this, the excess funds ("spillover") are automatically routed to the **Suspense Ledger** for manual Admin re-allocation to prevent overfunding.
- **Guest Donation Logic:** Supports unauthenticated giving by creating a `GuestDonor` identity (unique by email) and linking a `GuestDonation` record.

### 7. Forensic Audit System (`src/modules/audit`)
Givar maintains a platform-wide "Watchtower" that records every state mutation.
- **Contextual Tracking:** Every log captures the actor's IP address and User-Agent. Sensitive actions (e.g., `DISBURSEMENT_RECORDED`, `PROJECT_DELETED`) are flagged for the 24h Security Summary.
- **Transactional Logging:** Audit logs are passed into Prisma transactions. If the business logic fails and rolls back, the audit log is never created, ensuring the log always matches the ground-truth state.

### 8. Hybrid Identity & KYC State Machine (`src/modules/organization`)
The verification pipeline supports diverse entity types (`KycType`).
- **State Convergence:** When an Admin verifies an organization, the account is upgraded.
    - **Corporate Entity:** `User.accountType` upgrades to `ORGANIZER`.
    - **Individual Advocate:** `User.accountType` remains `INDIVIDUAL`, but the profile gains `VERIFIED` status to launch public causes.
- **Identity Pinning:** Once verified, an organization’s `legalName` is pinned to all its projects, preventing identity swapping during active fundraising.

### 9. Transactional Email Infrastructure (`src/modules/email`)
Givar utilizes Resend for all automated communications.
- **Asynchronous Dispatch:** Email calls use "Fire and Forget" logic (non-blocking) to ensure API performance.
- **Preference Filtering:** The service checks the `User.preferences` JSON. Users can granularly opt out of `donationReceipts` or `milestoneUpdates` while still receiving `securityAlerts`.

### 10. Proposal Lifecycle & Auto-Save (`src/modules/proposal`)
The proposal module acts as a secure sandbox for future projects.
- **Submission Gatekeeper:** Final submission requires a `coverImage`, a complete `budgetBreakdown` with assigned vendors, and at least one `kycDocument`.

### 11. Treasury Intelligence & Reconciliation (`src/modules/admin`)
- **Consensus Achievement:** Admins can verify Givar's internal ledger against Paystack's "Ground Truth" via the `verifyExternalTransaction` endpoint.
- **Manual Sync:** The protocol allows manual fulfillment of orphaned transactions while maintaining the exact fee/tip mathematical intent frozen at the time of payment initiation.

### 12. Hybrid Recommendation & Discovery Engine (`src/modules/recommendations`)
Givar utilizes a multi-stage discovery pipeline to balance organic momentum, donor relevance, and administrative intent.
- **Hybrid Scoring Logic:** The engine calculates a "Visibility Score" using a weighted formula: `(Recency Decay × Weight) + (7-Day Donation Velocity × Weight) + Admin Weighting + Manual Boost`. 
- **Logarithmic Decay:** Newer projects receive a boost that tapers off using a `1 / log2(2 + age_in_days)` decay curve, preventing stagnant projects from camping at the top of the feed.
- **Diversity Enforcement:** To prevent "sector clusters," the `DiversityEngine` scatters duplicate categories natively within the feed.
- **Administrative Control:** Admins can manually override the algorithm using `FeaturedSlots` (pinned positions 1-5).
- **Subcategory Taxonomy:** Causes are deeply categorized (e.g. `Medical -> Surgery`) across the ecosystem.

### 13. Integrated Communication & Feedback Loop (`src/modules/communication`)
Givar facilitates a secure, direct dialogue between administrative compliance nodes and project organizers.
- **Contextual Threading:** Messages are logically partitioned by the entity they address, creating a permanent, forensic-grade record of all vetting discussions.
- **Bidirectional Alerts:** Messages from admins notify the specific organizer, while organizer replies are broadcasted to all administrative nodes.

### 14. Notification System (`src/modules/notifications`)
The platform features a centralized event dispatcher designed to keep users synchronized with their impact ledger.
- **Actionable Alerts:** Every notification is optionally linked to a specific platform route, enabling users to move from an alert to the relevant ledger record or management console in a single interaction.

## Invariants (Do Not Violate)
- **Ledger Integrity:** Never update a project's raised amount without a corresponding `WalletTransaction`, `Donation`, and `AuditLog` entry. Revenue must be explicitly credited to the system node.
- **Audit Compulsion:** Never bypass the `AuditService` for state mutations. Every change must be traceable to an actor.
- **Private Asset Security:** Never store or serve public URLs for KYC or legal documents. Assets must remain in the `/private/` S3 path and be accessed via short-lived (15-min) presigned URLs.
- **Impersonation Lock:** Never permit `POST`, `PATCH`, or `DELETE` requests while an admin is impersonating a user. This is enforced by the platform-wide `ReadOnlyGuard`.
- **Idempotency:** Always use the payment gateway reference as a unique constraint in the ledger to prevent duplicate processing of the same financial event.

## Workflow: Adding a New Financial Feature
1.  **Schema:** Add the transaction type to `AuditAction`, `TxStatus`, and `TxCategory` in `schema.prisma`.
2.  **Service:** Implement logic in `WalletService` or `DonationService`. **Always** use `this.prisma.$transaction`.
3.  **Audit:** Ensure `this.audit.log()` is called within the transaction block.

## API Documentation
The API is self-documenting via its NestJS modules and Swagger UI. When running the server locally, visit `http://localhost:3001/api/docs` for the complete OpenAPI specification.

## Final Note for Backend Developers
This system is built for **forensic integrity**. If you are tasked with changing how money moves through the platform, your first point of reference must be the `WalletRepository`. Never modify project balances directly; always create a supporting double-entry transaction record.
```