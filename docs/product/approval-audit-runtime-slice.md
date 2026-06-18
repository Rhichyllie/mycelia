# Approval + Audit Runtime Slice

Phase 3D creates the first narrow approval + audit runtime slice for the
governed compliance/document review path.

It starts from the Phase 3C medium-risk approval-required persisted flow. A
pending `ApprovalRequest` can now be decided, persisted through the Phase 3B
repository boundary, reflected in a `RuntimeStateSnapshot`, recorded as an
`APPROVAL_DECIDED` `AuditRecord`, read back, and reconstructed as a safe
descriptor.

## Why Approval And Audit Together

Approval decisions are governance moments. In this slice, a decision is not
complete unless the decision result, lifecycle state and audit trail move
together through the repository boundary.

Keeping approval and audit together prevents an approval-only path from
creating state without an audit-addressable record.

## Decision Paths

The slice supports exactly these paths:

- approve pending approval -> approval status `APPROVED`, lifecycle state
  `APPROVED`, verdict `APPROVAL_AUDIT_APPROVED`;
- reject pending approval -> approval status `REJECTED`, lifecycle state
  `REJECTED`, verdict `APPROVAL_AUDIT_REJECTED`;
- timeout pending approval -> approval status `TIMED_OUT`, lifecycle state
  `FAILED`, verdict `APPROVAL_AUDIT_TIMED_OUT`;
- cancel pending approval -> approval status `CANCELLED`, lifecycle state
  `CANCELLED`, verdict `APPROVAL_AUDIT_CANCELLED`;
- unsafe or invalid decision -> fail closed with
  `APPROVAL_AUDIT_FAILED_SAFE`.

Only pending approval requests may be decided.

## Records Written And Read Back

For approved, rejected, timed out and cancelled decisions, the slice writes and
reads back:

- `ApprovalRequest` decision fields;
- `RuntimeStateSnapshot` for the resulting lifecycle state;
- `AuditRecord` with moment `APPROVAL_DECIDED`.

The slice also reads existing approval, state and audit descriptors through the
repository boundary before and after the write path.

## Safety Boundaries

The slice fails closed when tenant, run or approval request identifiers are
missing, when the approval request is not pending, when tenant/run scope does
not match, when the decision outcome is unsupported, when raw content fields are
present, or when the injected repository/client fails.

Denials are safe and do not leak SQL errors, stack traces, raw DB details,
sensitive payloads or tenant existence across scopes.

## Audit Scope

Phase 3D writes only the minimal approval decision audit moment:

- `APPROVAL_DECIDED`

It does not create a broad audit service, append-only event store, hash chain,
signing, sealing, export, PDF generation or downloadable artifacts.

## Out Of Scope

Phase 3D does not add:

- full runtime product;
- API routes;
- UI;
- auth or RBAC;
- notifications;
- Postgres support;
- multi-tenancy admin;
- billing;
- replay execution;
- external integrations;
- broad audit service;
- event emission;
- workflow execution;
- tool execution;
- MapIA revival.

## Relationship To 3C

Phase 3C proves that a governed flow can create and read the first persisted
records, including a pending `ApprovalRequest` for medium-risk review. Phase 3D
continues that persisted path by deciding the pending approval and adding the
minimal audit trail for the decision.

## Next Phase

Phase 3E adds the persisted investigation read model. It reads the persisted
governed run, approval and audit records safely through the repository boundary
without creating API routes, UI, auth, replay execution or external
integrations.

Phase 3F renders that read-model shape in a static read-only investigation UI
surface. It does not add live data access, approval UI, auth, replay execution
or export behavior.

Phase 3G keeps the UI read-only and connects it to the persisted investigation
read model through a controlled selection boundary. Approval decisions remain
out of scope for the UI.

Phase 3H adds a separate controlled request creation preview. It does not add
approval UI, API routes, auth, replay execution, export behavior or case
management.
