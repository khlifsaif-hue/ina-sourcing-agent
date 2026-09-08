# Architecture

## Bounded modules

1. Requirement Engineering
2. Supplier Intelligence
3. RFQ Management
4. Quotation Normalization
5. Technical Compliance
6. Negotiation History
7. Samples & QA
8. Freight / Landed Cost
9. Supplier Scoring
10. Communications Audit Trail
11. Human Approval Gates

## Communication lineage

Every supplier interaction should be linked to:

`Sourcing Request → Supplier → RFQ → Quotation → Negotiation`

This prevents isolated email threads and preserves procurement memory.

## Non-negotiable controls

- No secrets committed to GitHub.
- No payment action without explicit approval.
- No final PO without explicit approval.
- No technical substitution silently treated as compliant.
- Supplier type must distinguish factory / trader / unknown.
- Every price revision should create a negotiation record instead of overwriting history.
