# Working on INA Sourcing Agent

Read `PROJECT_STATUS.md` before editing. Treat it as a checkpoint, then inspect
Git changes and relevant live state to establish what has changed. Do not repeat
the account/project discovery audit unless identifiers or access have changed.

Reuse the existing project and modules. `src/modules/scoring/rank.ts` is the
scoring policy; `src/modules/approvals/policy.ts` is the action policy. Extend
their callers instead of introducing competing implementations. Existing search,
communication and language interfaces are the integration points.

Use deterministic code for price arithmetic, comparison gates and validation.
Keep model-backed work bounded and test with synthetic fixtures. Do not spend
live search/model credits or contact suppliers merely to run routine tests.

Run relevant regression tests and the build for substantive backend changes.
Repeat checks only after a relevant change or to resolve a concrete failure.
Never mark a provider, database connection or workflow ready from an interface,
environment-variable presence, a static UI label or a liveness response alone.

After a milestone, update `PROJECT_STATUS.md` with source location, validation,
remaining work and deployment state. Keep credentials out of code and logs.
