# Minimal Investigation UI Surface

Phase 3G connects the Phase 3F investigation surface to the Phase 3E persisted
investigation read model through a controlled read-only selection boundary.

The module separates:

- descriptor contract and record-kind invariants;
- safe static fixtures;
- read-only reference records behind the repository boundary;
- read-model loader and mapper;
- integration with the Phase 3G selection boundary;
- presentation normalization for missing, incomplete and blocked states;
- semantic React rendering.

It does not query databases, instantiate PrismaClient, call APIs, call fetch,
use auth/session state, execute replay, execute tools, emit events, write
files, create file artifacts or revive retired source.

The route surface now loads through the persisted investigation read model while
remaining read-only. Future work can replace the reference source with a
production read-only repository client without changing the JSX contract.
