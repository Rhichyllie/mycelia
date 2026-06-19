# MYCELIA Tenancy Boundaries

This module contains the Phase 1B tenant, workspace, and project boundary
skeleton for MYCELIA.

It provides pure TypeScript primitives for:

- tenant, workspace, project, and organizational scopes;
- deterministic same-tenant, same-workspace, and same-project checks;
- safe denial results for boundary mismatches.

This module follows Document 14's rule that tenant context is an execution
boundary. It does not resolve tenants, authorize users, enforce RBAC, configure
database Row-Level Security, protect API routes, emit events, implement runtime
execution, or create persistence models.

Scopes use opaque identifiers from `src/mycelia/foundation/shared-kernel/`. They must not
contain tenant names, workspace names, project names, emails, domains, legal
names, or other business identifiers.
