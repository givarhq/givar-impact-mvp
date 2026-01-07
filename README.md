# Givar Impact MVP

Givar Impact is the first product within **Givar**, focused on making giving more transparent, human, and impact-driven.

This repository contains the **MVP codebase** for Givar Impact — a platform that enables users to discover impact projects, contribute funds, track progress toward funding goals, and see when real-world needs are fulfilled.

---

## Purpose of This MVP

The goal of this MVP is to:
- Validate the Givar Impact concept
- Demonstrate transparency in giving
- Provide a demo-ready product for early users, partners, and stakeholders

This MVP prioritizes **clarity, trust, and usability** over scale or advanced automation.

---

## Core Features (MVP Scope)

- User authentication (sign-up / login)
- Impact project listings and project detail pages
- Transparency tracker showing:
  - Funding goal
  - Amount raised
  - Remaining balance
- Funding flow via a third-party payment gateway
- Logical wallet balance management
- Donation history for users
- Admin controls for managing projects
- Notifications when project funding goals are reached

---

## Out of Scope (for this MVP)

- Regulatory fund custody or licensing
- Advanced wallet features (e.g. withdrawals, transfers)
- Peer-to-peer giving (Givar Direct)
- Employee recognition / B2B features
- Mobile applications
- Full scalability or performance optimisation

These will be addressed in later phases.

---

## Tech Stack (Indicative)

The final stack may evolve during development, but the MVP is expected to use modern, pragmatic tools suitable for rapid iteration.

- Frontend: React / Next.js
- Backend: Node.js (TypeScript)
- Database: PostgreSQL
- ORM: Prisma (or equivalent)
- Payments: Third-party payment gateway approved by Givar
- Hosting: Cloud-based deployment
- Version control: GitHub (company-owned repository)

---

## Project Structure

High-level structure (subject to change during development):
/src
/auth
/projects
/wallet
/transactions
/admin


---

## Getting Started

> TODO: Setup and local development instructions will be added as part of the MVP build.

---

## Documentation & Handover

This repository is maintained with continuity in mind.

It will include:
- Clear commit history
- Basic setup and deployment documentation
- Notes on key architectural decisions
- Known limitations and technical debt

The intent is that another qualified developer can reasonably take over development if required.

---

## Contributing

This repository is maintained by the Givar team and approved contractors.  
Contributions are managed through direct collaboration and are subject to the terms of relevant agreements.

---

## About Givar

Givar is building a platform to make giving more transparent, direct, and trustworthy — starting with impact-driven projects and expanding into other forms of giving over time.

---

## Status

🚧 In active development (MVP phase)

