# StateTransition

Phase 1J defines pure typed state transition contracts for MYCELIA.

This module models transition intents, allowed non-executing transition rules,
validated transition descriptors, and transition validation results between
`RuntimeState` snapshots.

It is not a `StateTransitionCoordinator`. It is not a state machine. It does
not mutate `RuntimeState`, persist records, emit events, create checkpoints, or
execute runtime work.

The module exists only to define transition intent/result contracts and
validation helpers that future coordination and persistence layers must respect.
