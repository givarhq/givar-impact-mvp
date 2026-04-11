# Givar Web Client

The frontend of Givar is a highly optimized, reactive user interface built on Next.js 16. It communicates seamlessly with the API engine to render the transparent public ledger and the administrative control consoles.

## Tech Stack
- **Framework:** Next.js 16.1 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** Zustand (Client state) & TanStack Query (Server state synchronization)
- **Validation:** Zod & React Hook Form

## Frontend Reactive Architecture

### State Management
We utilize a split-state paradigm:
1.  **Server State:** Driven by the `ApiService` utilizing Next.js native `fetch` with Cache Tags (`next: { tags: ['project-list'] }`). This ensures the UI and the Ledger stay in sync without manual page refreshes, enabling instant navigation.
2.  **Client State:** Minimalist approach using `Zustand` for UI-only state (modals, auto-save buffers, and multi-step wizards). The `useProposalStore` perfectly isolates the complex draft creation process from the network.

### Type Safety
The Frontend imports Zod schemas and TypeScript interfaces directly from the shared `@givar/types` and `@givar/database` packages. This guarantees that frontend interfaces exactly match the Prisma database schema.

### Proposal Auto-Save Pipeline
The proposal module acts as a secure sandbox.
- **Debounced Auto-Save:** A specialized hook (`useProposalAutoSave`) detects changes in the frontend `Zustand` store and debounces updates to the backend API.
- **Validation Gates:** Final submission validates complex nested schemas (e.g. `budgetBreakdown`, `executionTimeline`) before dispatching to the API.

## UI Specific Invariants

### 1. The `SmartCurrency` Component
Because the backend operates exclusively in Minor Units (`BigInt`) to prevent float manipulation, the frontend receives all monetary values as strings (e.g. `"5000000"` for ₦50,000.00).
- **Rule:** Never perform JavaScript math operations on monetary strings directly in a component. 
- **Rule:** Always use the `<SmartCurrency />` component or the `formatCurrency` utility function to safely render balances. These utilities gracefully convert the minor units into localized, human-readable formats.

### 2. Client-Side Authentication Routing
Middleware intercepts routes based on the `givar_token` and `givar_view_mode` cookies.
- Do not attempt to read JWT tokens inside client components. Rely on the `ApiService.auth.getMe()` synchronizer or the `IdentitySync` layout wrapper to provide user context to React context trees.

### 3. Extending the Admin Dashboard
If you need to add a new administrative view:
1. Add the view in `apps/web/app/(admin)`.
2. Maintain UX consistency by utilizing the `AdminDataTable` and `ConfirmModal` UI primitives.
3. Ensure the route falls under the scope of the `AdminShell` layout to inherit the necessary role-based guards.
```