# INA Sourcing Agent

Standalone sourcing and procurement intelligence platform for INA Smart.

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

5. Generate/apply database migrations after validating the schema:

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
