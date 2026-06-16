# Minimal Governed Run Lifecycle

Phase 2S defines the first pure TypeScript lifecycle layer for the frozen
`Governed compliance/document review flow`.

This is in-memory transition logic only. It does not execute runtime, persist
data, connect to a database, import Prisma, create migrations, call APIs, call
tools, call external services, emit events, write audit records, render UI,
export files, generate PDFs or create downloadable artifacts.

## Lifecycle States

The minimal lifecycle uses exactly these states:

1. `CREATED`
2. `CONTEXT_RESOLVED`
3. `POLICY_EVALUATED`
4. `ADMISSION_GRANTED`
5. `WAITING_APPROVAL`
6. `APPROVED`
7. `REJECTED`
8. `RUNNING`
9. `COMPLETED`
10. `CANCELLED`
11. `FAILED`

Terminal states are:

- `COMPLETED`
- `CANCELLED`
- `FAILED`
- `REJECTED`

Terminal states cannot transition to another lifecycle state.

## Transition Intents

The lifecycle accepts exactly these transition intents:

- `RESOLVE_CONTEXT`
- `EVALUATE_POLICY`
- `GRANT_ADMISSION`
- `REQUIRE_APPROVAL`
- `APPROVE`
- `REJECT`
- `START_RUN`
- `COMPLETE_RUN`
- `CANCEL_RUN`
- `FAIL_RUN`

## Allowed Transitions

The deterministic transition table is:

- `CREATED` -> `CONTEXT_RESOLVED` via `RESOLVE_CONTEXT`
- `CONTEXT_RESOLVED` -> `POLICY_EVALUATED` via `EVALUATE_POLICY`
- `POLICY_EVALUATED` -> `ADMISSION_GRANTED` via `GRANT_ADMISSION`
- `POLICY_EVALUATED` -> `WAITING_APPROVAL` via `REQUIRE_APPROVAL`
- `POLICY_EVALUATED` -> `REJECTED` via `REJECT`
- `WAITING_APPROVAL` -> `APPROVED` via `APPROVE`
- `WAITING_APPROVAL` -> `REJECTED` via `REJECT`
- `ADMISSION_GRANTED` -> `RUNNING` via `START_RUN`
- `APPROVED` -> `RUNNING` via `START_RUN`
- `RUNNING` -> `COMPLETED` via `COMPLETE_RUN`
- any non-terminal state -> `CANCELLED` via `CANCEL_RUN`
- any non-terminal state -> `FAILED` via `FAIL_RUN`

All other transitions fail closed.

## Fail-Closed Denial Behavior

The lifecycle evaluator returns a shared-kernel `Result`.

Allowed transitions return an `ALLOWED` decision containing:

- current state;
- requested intent;
- next state;
- fixed safe reason code;
- fixed safe reason;
- conceptual persistence mapping;
- future audit-addressable implication.

Invalid input or disallowed transitions return a safe denial containing:

- safe denial code;
- current state and intent only when they are recognized safe enum values;
- fixed safe reason code;
- fixed safe reason;
- non-enumerating message.

Denials do not expose hidden state, tenant existence, document content,
database state, policy internals, approval internals or audit internals.

## Persistence Mapping

The lifecycle maps conceptually to the Phase 2R persistence scaffold:

- next state maps to future `GovernedRun.currentState`;
- terminal outcome maps to future `GovernedRun.status`;
- next state maps to future `RuntimeStateSnapshot.state`;
- accepted decisions are future audit-addressable lifecycle moments;
- denials are future audit-addressable governance moments.

This mapping does not create records and does not write to storage.

## Audit Implications

Each allowed transition or denial should become audit-addressable in a future
audit commit boundary phase. Phase 2S does not write audit records, append audit
logs, emit events, sign records, seal records, hash-chain records or export
evidence.

## Module Alignment

The lifecycle layer aligns with:

- `src/mycelia/runtime-slice-technical-plan/`
- `src/mycelia/runtime-persistence-model/`
- `src/mycelia/policy-admission-v1/`
- `src/mycelia/state-transition/`
- `src/mycelia/state-transition-coordinator/`
- `src/mycelia/governed-run/`
- `src/mycelia/runtime-state/`

It does not replace the earlier state transition contracts. Those contracts
remain the older descriptor-level transition surface; Phase 2S adds the minimal
runtime-slice lifecycle layer planned in Phase 2Q.

Phase 2T adds pure in-memory policy/admission decision logic that produces
lifecycle intent hints: `GRANT_ADMISSION`, `REQUIRE_APPROVAL` or `REJECT`.
Those hints do not transition a run by themselves.

Phase 2U adds a pure audit commit boundary that marks lifecycle transitions and
terminal run moments as audit-addressable requirements. It does not write audit
records or emit events.

Phase 2V adds a pure approval gate that maps approved decisions to `APPROVE`,
rejected decisions to `REJECT`, timed-out approvals to `FAIL_RUN` and cancelled
approvals to `CANCEL_RUN`. These are lifecycle intent hints only and do not
transition, persist, audit or execute a governed run by themselves.

Phase 2W consumes lifecycle decisions as provided investigation descriptors. It
does not replay transitions, infer missing lifecycle events, persist state or
render UI.

Phase 2X consumes lifecycle timeline descriptors when assembling replay dry-run
steps. It does not execute transitions or reconstruct state beyond supplied
descriptors.

## Out of Scope

- runtime execution;
- persistence;
- DB access;
- migrations;
- Prisma generate;
- repository/service layer;
- API routes;
- auth;
- UI;
- event emission;
- audit record writing;
- workflow execution;
- replay execution;
- tool execution;
- external integrations;
- export/PDF/download behavior.

## Next Implementation Phases

The next runtime-slice phase is:

- 2Y Internal Runtime Service Boundary

Those phases should continue to preserve narrow scope and avoid broad workflow,
API, auth, persistence or external-integration expansion until the minimal
governed compliance/document review flow is coherent.
