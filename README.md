# MYCELIA

MYCELIA is in early bootstrap. The active runtime, API, database schema, and
product UI have not started.

The former active MapIA-derived implementation was quarantined under
`legacy/mapia-active-snapshot/` and is reference-only. It must not be used as the
MYCELIA runtime foundation without explicit architecture review.

Canonical architecture lives in `docs/mycelia/`. Implementation alignment
scaffolding lives in `docs/architecture/`. Contract registry placeholders live
in `contracts/`.

Implemented TypeScript foundations currently live under:

- `src/mycelia/shared-kernel/`
- `src/mycelia/tenancy-boundaries/`
- `src/mycelia/runtime-identity/`
- `src/mycelia/event-envelope/`
- `src/mycelia/policy-decision-gateway/`
- `src/mycelia/runtime-envelope/`
- `src/mycelia/runtime-admission-gateway/`
- `src/mycelia/governed-run/`
- `src/mycelia/runtime-state/`
- `src/mycelia/state-transition/`
- `src/mycelia/state-transition-coordinator/`
- `src/mycelia/audit-record/`
- `src/mycelia/audit-recorder/`
- `src/mycelia/audit-emission/`
- `src/mycelia/audit-timeline/`
- `src/mycelia/investigation-bundle/`
- `src/mycelia/replay-plan/`
- `src/mycelia/demo-scenario/`
- `src/mycelia/demo-scenario-fixture/`
- `src/mycelia/demo-readiness-report/`

## Safe Phase 0 Command

```bash
pnpm validate:phase0
```

This runs the current lint, typecheck, no-active-tests Vitest baseline, and
documentation/registry presence check. Phase 1 tests now cover the shared
kernel, tenant boundary skeleton, runtime identity/request envelope skeleton,
EventEnvelope type skeleton, PolicyDecisionGateway type skeleton, and
RuntimeEnvelope type skeleton, RuntimeAdmissionGateway type skeleton, and
GovernedRun type skeleton, RuntimeState type skeleton, and StateTransition
contract skeleton, StateTransitionCoordinator skeleton, and AuditRecord
contract skeleton, AuditRecorder skeleton, AuditEmission contract skeleton,
AuditTimeline contract skeleton, InvestigationBundle contract skeleton,
ReplayPlan contract skeleton, DemoScenario contract skeleton,
DemoScenarioFixture contract skeleton, and DemoReadinessReport contract
skeleton.

## Guarded Commands

`pnpm dev`, `pnpm build`, and `pnpm start` are intentionally guarded for now.
They do not start Next.js because the active app shell has not been rebuilt.

## CI Baseline

Phase 0 CI runs `pnpm validate:phase0`.

Runtime and product build CI will be added later, after implementation begins.
The CI intentionally does not run `pnpm dev`, `pnpm build`, `pnpm start`, Prisma
commands, migrations, or deployment steps.

Future implementation work must follow
`docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`.
Do not revive MapIA as the active MYCELIA foundation.
