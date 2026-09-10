# INA Sourcing Agent

Standalone sourcing and procurement intelligence platform for INA Smart.

## Current readiness

**Development foundation; not an operational autonomous agent.** Read
`PROJECT_STATUS.md` before continuing work. It records the verified deployment,
database, existing modules and remaining integrations. A successful `/api/health`
response means the web server is running, not that sourcing is functional.

The data APIs now require a server-only `SOURCING_API_TOKEN` (at least 32 random
characters) sent as `Authorization: Bearer <token>`. They fail closed when it is
missing. This is service access for the single-owner foundation; it is not a
replacement for the planned browser sign-in. Never expose this credential in
client code, `NEXT_PUBLIC_*`, local storage, screenshots or logs.

`GET /api/readiness` requires the same authorization, probes the runtime database,
and returns HTTP 503 until all required capabilities are actually connected.
`POST /api/supplier-discovery` currently qualifies supplied candidates only.

For development checks, use Node 24 and run `npm ci`, `npm run lint`, `npm test`
and `npm run build`. The build does not require production credentials. Regression
tests use synthetic fixtures and make no supplier contact or database writes.

## Purpose

The system is designed to manage the full sourcing lifecycle:

Requirement → RFQ → Supplier Discovery → Supplier Qualification → Quotation → Technical Compliance → Negotiation → Sample → Freight/Landed Cost → Supplier Ranking → Approval → PO.

## Core principle

**Never accept a lower price by silently changing the requested technical specification.**

Example: if the RFQ requires `23AWG Solid Bare Copper` and a supplier offers `CCA`, that offer must be recorded as a technical deviation and require an engineering/procurement decision.

## Stack

- Next.js 16 / React 19 / TypeScript
- Neon PostgreSQL
- Drizzle ORM
- Zod validation
- Gmail integration planned for supplier communication
- Google Drive planned for RFQs, quotations, certificates and samples

## Initial database domains

- sourcing_requests
- product_specifications
- suppliers
- supplier_contacts
- rfqs
- quotations
- technical_compliance
- negotiations
- shipping_quotes
- communications
- supplier_evaluations

## Supplier-facing identity

- Seif Khelif
- INA Smart – Procurement & Sourcing
- khlif.saif@gmail.com

## Setup

1. Copy `.env.example` to `.env.local`.
2. Put your **Neon pooled connection string** in `DATABASE_URL`.
3. Do not commit `.env.local`.
4. Install dependencies:

```bash
npm install
```

5. The existing Neon database already has application tables. Inspect and baseline
   its schema before creating migrations; do not create a second database or run
   fresh create-table migrations on production. Test schema changes on a Neon
   development branch, using its direct connection for migration operations.

   For a new, empty development database only:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

6. Run locally:

```bash
npm run dev
```

## Initial live sourcing case

### Product A
CAT6 U/UTP, 23AWG Solid Bare Copper, 4 pairs, Double Jacket FRPVC, 250MHz, 305m, TIA/ISO/IEC compatible, PoE compatible. Initial quantity: 500 boxes monthly.

### Product B
CAT6 S/FTP, 23AWG Solid Bare Copper, individual foil, 40% tinned-copper braid, ECCS steel-tape armour, PVC inner jacket, UV-stabilized PE outer jacket, OD 12.6 ± 1.5mm, 305m. Initial quantity: 100–200 boxes monthly.

Destination: Qatar.

## Approval gates

The agent may autonomously search, qualify suppliers, prepare RFQs, request technical clarifications and negotiate within configured limits. Payment, final supplier commitment and PO release must require explicit human approval.
