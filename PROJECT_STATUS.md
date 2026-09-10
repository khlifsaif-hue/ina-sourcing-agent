# INA Sourcing Agent — implementation checkpoint

Audited: 10 September 2026. Goal: turn a precise sourcing request into researched
factory/supplier candidates, communicate in each supplier's language, obtain real
quotes, and compare compliant offers by cost and quality for Seif's decision.
Reference: the user's IMG_6688.jpeg workflow drawing.

## Resume here

Continue this existing codebase. Do not recreate the project, database, UI or
agent modules. Read this checkpoint, inspect changes since its source baseline,
then work on the first incomplete step below. Update this file after a meaningful
change with what was tested, where it was saved and whether it was deployed.

- Repository: https://github.com/khlifsaif-hue/ina-sourcing-agent (private).
- Existing integration branch: `integration/sourcing-agent`.
- Audit baseline commit: `1e74d6069534bc986b6834e8d1b3765f40b909f4`.
- Baseline tree: `aed43e4999cb340a85e4dbe77932d85bf6badb65`.
- All 35 baseline files were recovered and checked against Git blob hashes.
- `main` was behind integration at `e2f53eefb76a685ed0aacd035c498933a976af47`.
- Other branches already exist: `feat/procurement-core`,
  `feat/supplier-discovery-agent`, `feat/live-neon-dashboard`.
- Existing PR #2 targets main from the discovery feature branch. Do not reapply
  those modules when integrating this work.

## Verified live state

- Site: https://ina-sourcing-agent.netlify.app
- Netlify site ID: `ae876e06-5c18-4f86-89a3-04fe16248df4`.
- Observed production deployment: `6aa11ca74204622d4a77ddb2`, published
  9 September 2026 at 08:45:53 UTC, status ready.
- Deployment source was CLI, with no recorded source commit or source ZIP.
  It is therefore not proven to match a particular repository branch.
- The site and `/api/health` returned HTTP 200.
- `GET /api/sourcing-requests` returned HTTP 405.
- `GET /api/supplier-discovery` returned HTTP 404; a working POST-only route in
  the integration source should return 405 for GET, not 404.
- No scheduled functions were listed in this deployment.
- These observations establish an older/different deployed route set, not a
  working autonomous agent. The Netlify-to-Neon runtime connection is still
  unverified; a liveness endpoint does not query the database.

## Verified database state

- Neon organization: `org-gentle-paper-97541403`, free plan.
- Project: `lively-tree-29020103`, name `INA-Sourcing-Agent`.
- Region: `aws-eu-central-1`.
- Only observed branch: `br-quiet-shape-b1o27py9`, name `production`, default.
- 19 application tables exist, plus Neon Auth tables. Auth tables alone do not
  establish that application login or API authorization is implemented.
- Exact row-count reads returned zero sourcing requests, suppliers, RFQs,
  quotations, communications and agent runs.
- No production data or schema was changed in this audit.
- Source has no committed migration baseline. Compare actual constraints and
  defaults before generating one; do not rerun fresh create-table SQL.

## Workflow readiness

| Drawing requirement | Existing implementation | Missing to become operational |
| --- | --- | --- |
| Specific request | Requirement assessment, specification types, request list/create route, database tables | Authenticated form, structured specification persistence and execution endpoint |
| Global supplier/factory search | Search-provider interface, deduplication, candidate screening | Real search provider, source verification, durable jobs and retries, request-linked supplier persistence |
| Contact suppliers for prices | English RFQ generators and communication state machine | Gmail OAuth sender, inbound replies, thread mapping, idempotent outbox, follow-up limits |
| Supplier's language | Language preference policy with country fallback and English-copy handling | Translation implementation, technical-value preservation checks, original/translated message storage |
| Filter price and quality | Compliance rules, conductor checks, offer normalization, landed-cost arithmetic and ranking | Quote intake, same-basis/FX normalization, linked compliance evidence and a working comparison view |
| Controlled agent actions | Approval policy and audit/persistence helpers | Verified browser identity, enforceable approval decisions, atomic action/audit writes and an orchestrator that uses them |
| Final recommendation | Core scoring gate | End-to-end tested report based on real quotes and auditable evidence |

## Changes prepared in this audit

1. Data API access fails closed using a server-only service credential. Missing
   credentials return 503; missing/invalid authorization returns 401. Browser
   authentication remains a separate incomplete integration.
2. Database initialization is lazy, after authorization. Invalid JSON returns 400;
   database details and credentials are not exposed in error responses.
3. Added protected runtime readiness reporting. A reachable database alone cannot
   report the unfinished agent as ready.
4. Empty/unqualified searches are blocked. Published-price leads go to compliance
   review rather than bypassing it. Empty/duplicate claims cannot inflate scoring.
5. Comparison rejects nonfinite prices, invalid quantities, below-MOQ orders,
   missing source/basis and unresolved mandatory deviations. Currencies, units,
   quantities and Incoterms have separate comparison groups; no FX conversion is
   invented and no cross-group cheapest-supplier claim is made.
6. Consolidated the duplicate scoring formulas into `rank.ts`, retaining the old
   function as a compatibility adapter. The active policy is 35% technical,
   30% landed-cost score, 15% credibility, 10% lead time and 10% commercial terms.
7. Specification deviation approval now uses the common policy. Unknown actions
   fail closed; payments remain prohibited for automatic execution.
8. Added regression coverage for procurement decisions and API authorization.
9. Removed misleading READY/autonomous claims from the unfinished dashboard.
10. Updated Next.js and its ESLint configuration to 16.3.4, React/React DOM to
    19.3.0, and Drizzle ORM to 0.45.2. Added a lockfile, Node 24 requirement and
    ESLint configuration. Next.js builds without database credentials.
11. Added a configurable sender-profile model and protected platform API. The
    active sender can be changed later without code changes. It stores display
    identity only; Gmail OAuth credentials are deliberately separate and no
    inbound/outbound email is enabled until that connection is authorized.
    The initial platform sender is now `info@inasmart.com`. The previously
    connected Ibtechar Gmail account is not used by this project and is not
    transferable to the deployed platform.
12. Added a server-side Gmail OAuth authorization layer: an administrator selects
    a sender profile, Google consent uses a short-lived hashed state and PKCE,
    and access/refresh tokens are AES-256-GCM encrypted at rest. The callback
    rejects a Google account that does not exactly match the selected sender
    email. It exposes status only—never token values. This is deliberately not
    yet email delivery or inbox processing.

Security references:
- https://nextjs.org/blog/CVE-2025-66478
- https://github.com/advisories/GHSA-gpj5-g38j-94v9

## Remaining implementation sequence

1. Wire verified browser sign-in and the request/specification form to the
   existing routes. Keep APIs protected; never put the service token in a browser.
2. Implement one bounded, source-backed search provider behind the existing
   `SupplierSearchProvider`. Add a request execution endpoint, durable job state,
   idempotency and audited persistence. Reuse existing orchestrator modules.
3. Implement translation and Gmail delivery/inbound processing, sending from the established identity
   selected in the platform. The first intended sender profile is
   `info@inasmart.com`; later it may be changed to another INA Smart account.
   Preserve originals and technical literals. The user's connected Gmail in
   ChatGPT is not automatically an OAuth grant for this app.
4. Implement inbound quote extraction and technical review, with explicit
   missing-data/deviation states, price history, comparable landed cost and the
   authenticated comparison view.
5. Test one complete workflow in an isolated database branch. Use a user-approved
   test recipient when sending email. Verify safe retries and no duplicate sends.
6. Deploy the tested source, record its exact commit and deployment ID, verify
   runtime database reads/writes and sign-in, and only then mark the agent ready.

External setup eventually required: app-specific Gmail OAuth configuration and
consent, a search/translation provider with a defined budget, and server-side
deployment configuration. Do not ask Seif for raw database passwords or tokens in
chat. Do not describe these settings as the only remaining work: the code above
still needs to be connected.

## Usage discipline

- Use this checkpoint and Git diffs to avoid repeating the full audit.
- Patch existing modules; do not introduce a second scoring, approval or language
  system. Keep one execution path.
- Use deterministic code for arithmetic, validation, deduplication and ranking.
  Reserve model calls for search interpretation, translation and quote extraction.
- Use bounded per-run call limits, cached source results and explicit retries
  when providers are added. No automatic paid research was enabled by this audit.
- For coding: Terra at Medium is a practical default; Luna suits small, precise
  edits. Reserve Astra for difficult architectural or integration blockers.
  These are workflow recommendations, not measured account usage savings.
- Do not promise background work after a chat turn unless an actual job has been
  configured and observed running.

## Validation and handoff

Validation completed on 10 September 2026:

- `npm run lint`: passed.
- `npm test`: 18 passed, zero failed.
- Sender profile and Gmail authorization validation: 21 tests passed, zero
  failed. Two additive migrations are staged at `drizzle/0001_sender_profiles.sql`
  and `drizzle/0002_gmail_oauth_credentials.sql`; neither has been applied to
  production. Gmail requires server-side `GMAIL_CLIENT_ID`,
  `GMAIL_CLIENT_SECRET`, `GMAIL_TOKEN_ENCRYPTION_KEY` and `APP_URL` before a
  live consent flow can begin.
- `npm run build`: passed, including TypeScript checks, without database secrets.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities.
- `git diff --check`: passed.
- Working/review branch: `audit/readiness-2026-09-10`, based on the integration
  baseline above. The accompanying PR targets `integration/sourcing-agent`.
- These source changes have not been deployed. The live observations above
  continue to describe the deployment inspected in this audit.

## Latest deployment milestone — 10 September 2026

- Both additive migrations were validated on disposable Neon branches and
  applied to production branch `br-quiet-shape-b1o27py9`.
- Production deploy `6aa2e35835b58513a9f7a6b9` is ready at
  `https://ina-sourcing-agent.netlify.app` (Next.js server handler deployed;
  Netlify secret scan found no committed secrets).
- The deploy was uploaded from the reviewed local source because the Netlify
  site is not connected to a Git commit; the exact uploaded source is recorded
  by the reviewed branch `audit/readiness-2026-09-10` and commit
  `ecb72d9` locally / its corresponding GitHub branch head.
- Gmail OAuth credentials are configured in Netlify, but no mailbox consent has
  been completed and no email has been sent. The agent is not yet end-to-end
  ready until the platform OAuth flow and authenticated UI are exercised.

Until that reviewed source is deployed and its integrations are exercised, the
live agent remains incomplete. Core unit tests do not establish Gmail delivery,
translation quality, source authenticity, runtime database connectivity or full
procurement workflow correctness.
