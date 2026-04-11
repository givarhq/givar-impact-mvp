# Givar Database & Schema

This package serves as the Single Source of Truth for the Givar platform. It houses the `schema.prisma` definitions, the database migration histories, and the centralized, type-safe Prisma Client used by both the API and the Web Client.

## Tech Stack
- **Database:** PostgreSQL (Hosted on Neon)
- **ORM:** Prisma 7.2.0
- **Adapter:** `@prisma/adapter-pg` (Serverless connection pooling)

## Database Setup

Ensure your local or Neon PostgreSQL instance is running and the `DATABASE_URL` is configured in `packages/database/.env`.

```bash
# 1. Generate the Prisma Client (Creates TypeScript definitions)
pnpm db:generate

# 2. Sync the schema with your database (For rapid development)
pnpm db:push

# 3. Open Prisma Studio to inspect the data visually
pnpm db:studio
```

## Database Migrations
When changing the schema in `packages/database/prisma/schema.prisma`:
1. Run `pnpm db:push` (for rapid dev) or `npx prisma migrate dev` (for formal, version-controlled migrations).
2. This automatically updates the local database schema and triggers the client generation for the rest of the monorepo.

---

## Database Seeding (Forensic Simulation)

The Givar platform utilizes a procedural seeding engine (`prisma/seed.ts`) to generate a high-fidelity development environment. This simulation is designed to test the platform’s **Forensic Integrity**, **Ledger Stability**, and **Administrative Workflows** by mirroring real-world philanthropic activity.

### 1. Seeding Strategy & Workflow
The seed script follows a strict relational dependency order to ensure data integrity:
1.  **Purge:** Atomic deletion of all existing records across the ledger.
2.  **Taxonomy:** Creation of system-wide `Category` and `Subcategory` nodes (Water, Education, Surgery, etc.).
3.  **Governance:** Initialization of `TransactionFeeRule` (Global 2.5% rate).
4.  **Identity:** Generation of `User` nodes (Admins, Organizers, and Donors).
5.  **KYC:** Initialization of `OrganizationProfiles` with forensic document keys.
6.  **Financial Nodes:** Initialization of routing nodes (`Wallets`) for double-entry mathematical tracking (Non-Custodial).
7.  **Pipeline Simulation:** Moving entities from `ProjectProposal` (Draft) to live `Project` status.
8.  **Liquidity Velocity:** Generating a 30-day history of `WalletTransactions` and `Donations` directly to projects, complete with fee snapshots.
9.  **Audit Trace:** Every event above generates a corresponding `AuditLog` entry.

### 2. How to Initialize the Simulation

**To Clear and Re-seed the Database:**
Navigate to the root directory and run the workspace-aliased command:
```bash
pnpm db:seed
```

### 3. Schema Models Seeded
The script targets the following models defined in `schema.prisma`:

| Model | Forensic Data Generated |
| :--- | :--- |
| **`User`** | System Admins, verified Organizers, and procedural Donor identities. |
| **`OrganizationProfile`** | Legal entity metadata and S3-compatible document keys. |
| **`Category` & `Subcategory`** | Industry-standard project sectors and specific focus areas. |
| **`ProjectProposal`** | Drafts, submissions, and rejected states for pipeline testing. |
| **`Project`** | Live, active, and funded projects with execution timelines. |
| **`Wallet`** | Routing nodes for double-entry math (NGN, USD, GBP). |
| **`WalletTransaction`** | The immutable ledger: Credits, Debits, and Suspense entries. |
| **`Donation`** | Historical donor-to-project links. |
| **`Disbursement`** | Treasury outflows to vendors for specific milestones. |
| **`MilestoneProof`** | User-submitted evidence (images/descriptions) for verification. |
| **`AuditLog`** | Full session and mutation history with IP/User-Agent metadata. |

### 4. The Seed Logic (Reference)
The core logic resides in `packages/database/prisma/seed.ts`. Key developer functions include:

*   **`prisma.model.deleteMany({})`**: Used at the start of the script to perform a clean-slate purge of the database.
*   **Procedural Math**: Uses `BigInt` for all financial generations to maintain precision and prevent floating-point errors.
*   **Temporal Distribution**: Uses `date-fns` to distribute donations across a 30-day window, populating the administrative analytics charts.
*   **State Machine Matching**: Ensures `ProjectProposals` marked as `APPROVED` have a corresponding `Project` record with matching `proposalId` for traceability.

**Developer Note:** If you modify the `schema.prisma`, you must run `pnpm db:generate` before re-running the seed to ensure the Prisma Client has the latest types for the seeding engine.