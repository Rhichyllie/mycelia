# RuntimeAdmissionGateway

Phase 1G defines the pure typed pre-runtime admission gate for MYCELIA.

This module validates runtime admission requests, runtime admission decisions,
policy decision alignment, runtime envelope usability, tenant scope consistency,
and fail-closed admission outcomes.

It is not a real runtime executor. It does not create `GovernedRun`, execute
workflows, emit events, persist state, authorize by itself, execute obligations,
or create approval workflows.

The module exists to define the contract that future runtime orchestration must
satisfy before any side-effect-capable operation is admitted.
