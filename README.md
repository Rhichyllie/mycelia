# MYCELIA

MYCELIA is a governed operational intelligence and governed agentic runtime
platform in staged development.

The current repository is honest about its state:

- contract and descriptor primitives exist;
- static product surfaces exist under the Next App Router;
- the first buyer-oriented use case is frozen;
- the first assessment and pilot offer package exists;
- runtime execution, active persistence, API routes, auth, database-backed runs and
  external integrations are not implemented yet.

## Current Product Direction

The frozen first commercial wedge is:

`Governed compliance/document review flow`

Plain-language version: a sensitive operational request enters the system.
MYCELIA frames the request, resolves identity and context, applies policy and
admission, requires human approval when risk requires it, records an audit trail,
enables investigation and prepares a replay dry-run without unsafe side effects.

The current internal commercial planning package defines:

- `Governed Operations Assessment`
- `Governed Compliance Flow Pilot`

These are planning artifacts, not guaranteed pricing, not SaaS readiness and not
production delivery claims.

## Implemented Today

Implemented TypeScript foundations currently live under `src/mycelia/`:

- shared kernel primitives;
- tenancy, runtime identity and request envelope contracts;
- event envelope, policy decision, runtime envelope and admission contracts;
- governed run, runtime state and state transition descriptors;
- audit record, recorder, emission, timeline, investigation and replay plan
  descriptor contracts;
- demo scenario, fixture, readiness and static artifact descriptor contracts;
- first static demo descriptor chain;
- in-memory static demo text renderer;
- human-readable static demo preview;
- static product surface view modules;
- product surface shell and product surface index;
- initial use case freeze;
- pilot offer package;
- runtime slice technical plan;
- minimal persistent model scaffold.

Static App Router product surfaces currently exist at:

- `/`
- `/mycelia`
- `/mycelia/executive`
- `/mycelia/static-demo`
- `/mycelia/walkthrough`
- `/mycelia/roadmap`

These surfaces are static, read-only and descriptor-level.

## Not Implemented Yet

The repository does not yet implement:

- runtime execution;
- workflow execution;
- active persistence;
- database-backed governed runs;
- real policy engine;
- real approval queue;
- real audit commit boundary;
- real investigation view;
- real replay execution;
- API routes;
- auth;
- external integrations;
- production deployment;
- SaaS billing;
- public SDK.

## Product Decision Artifacts

Product decision artifacts live under `docs/product/`:

- `initial-use-case-freeze.md`
- `pilot-offer-package.md`
- `runtime-slice-technical-plan.md`
- `minimal-persistent-model-scaffold.md`

Architecture alignment scaffolding lives under `docs/architecture/`.
Canonical architecture lives under `docs/mycelia/`.

## Safe Validation Command

```bash
pnpm validate:phase0
```

This runs lint, typecheck, Vitest and the Phase 0 documentation check.

## Guarded Product Commands

`pnpm dev`, `pnpm build`, and `pnpm start` remain guarded by the Phase 0 guard.
They should not be treated as activated product commands until a future phase
explicitly changes that boundary.

## Legacy Boundary

The former active MapIA-derived implementation was quarantined under
`legacy/mapia-active-snapshot/` and is reference-only. It must not be used as the
MYCELIA runtime foundation without explicit architecture review.

Future implementation work must follow
`docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`.
