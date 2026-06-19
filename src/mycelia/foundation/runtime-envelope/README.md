# MYCELIA Runtime Envelope

This module contains the Phase 1F RuntimeEnvelope type skeleton.

It defines the typed propagation context for MYCELIA runtime operations:
organizational scope, runtime identity, request reference, policy context,
event and correlation context, declared purpose, data classification, execution
mode, replay/investigation flags, timestamps, and safe metadata.

## What This Module Does

- Validates runtime envelope mode and production/non-production separation.
- Validates tenant, workspace, and project scope.
- Validates runtime identity, request, policy, event, correlation, purpose,
  classification, timestamp, and metadata shape.
- Provides Result-returning helper checks that fail closed for missing,
  malformed, non-production, or mode-conflicting envelopes.

## What This Module Does Not Do

- No real runtime execution.
- No `GovernedRun` creation.
- No workflow execution.
- No event emission.
- No persistence or hydration.
- No authorization by itself.
- No database, Prisma, API route, UI, RLS, approval workflow, or policy engine.

This module exists only to define the safe typed propagation capsule future
runtime components can consume.
