# GovernedRun

Phase 1H defines the pure typed shell contract for a MYCELIA `GovernedRun`.

This module validates an admitted or blocked governed run identity and metadata
envelope. It keeps the status set intentionally small: `CREATED`, `ADMITTED`,
`REJECTED`, and `CANCELLED`.

It is not real runtime execution. It does not execute workflows, emit events,
persist state, implement lifecycle transitions, create approvals, execute tools,
or perform side effects.

The module exists only to define the governed run shell contract that later
runtime orchestration must respect.
