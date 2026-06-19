# MYCELIA Event Envelope

This module contains the Phase 1D EventEnvelope type skeleton.

It defines pure TypeScript primitives for event names, event modes, event
subjects, safe payload descriptors, ordering hints, event envelope validation,
event checks, and safe event denial results.

This module follows Documents 07 and 08. It also depends on:

- `src/mycelia/foundation/shared-kernel/` for canonical identifiers, classifications, and
  Result helpers.
- `src/mycelia/foundation/tenancy-boundaries/` for organizational scope constraints.
- `src/mycelia/foundation/runtime-identity/` for request origin metadata.

## What This Module Does

- Describes the required shape of an EventEnvelope.
- Requires tenant, runtime identity, correlation, event identity, event mode, and
  safe timestamps.
- Keeps REPLAY, EVALUATION, TEST, INVESTIGATION, and PRODUCTION modes explicit.
- Validates subject and envelope scope alignment.
- Uses safe payload descriptors instead of raw payloads.
- Provides pure, side-effect-free checks and safe denial objects.

## What This Module Does Not Do

- No event broker.
- No event publishing.
- No event persistence.
- No event stream implementation.
- No queues.
- No canonical event catalog.
- No lifecycle states.
- No `GovernedRun`.
- No `RuntimeEnvelope` execution.
- No state machine.
- No database, Prisma, API, authorization middleware, RLS, or UI.

Event names are shape-validated only. They are not the MYCELIA canonical event
catalog.
