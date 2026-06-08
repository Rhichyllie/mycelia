# RuntimeState

Phase 1I defines pure typed `RuntimeState` and `RuntimeStateSnapshot`
descriptors for MYCELIA.

This module models a current snapshot of a `GovernedRun` shell using the current
non-executing kinds: `CREATED`, `ADMITTED`, `REJECTED`, and `CANCELLED`.

It is not a state machine. It does not transition states, execute workflows,
emit events, persist records, create checkpoints, or perform runtime work.

The module exists only to define typed runtime state and snapshot descriptors
that future state coordination and persistence layers must respect.
