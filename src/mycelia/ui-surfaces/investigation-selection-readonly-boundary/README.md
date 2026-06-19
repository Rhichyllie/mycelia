# Investigation Selection & Read-Only Boundary

Phase 3G defines a narrow target-selection boundary for the investigation
surface. It resolves a controlled reference target or an explicit tenant/run
scope, then delegates reconstruction to the persisted investigation read model.

This module is read-only. It does not mutate records, create API routes, create
auth or RBAC, execute replay, execute tools, export files, generate PDFs, call
external services, or create broad search/listing behavior.

The boundary exists so the `/mycelia/investigation` route can move beyond a
direct static fixture while preserving the Phase 3F presentation contract.
