# Approval + Audit Runtime Slice

This module defines the Phase 3D approval + audit runtime slice for the minimal governed runtime path.

It starts from a persisted medium-risk approval-required flow, resolves a pending `ApprovalRequest`, records the resulting lifecycle state through `RuntimeStateSnapshot`, writes a minimal `AuditRecord` for `APPROVAL_DECIDED`, reads the records back through the repository boundary, and reconstructs a safe descriptor.

This module is intentionally narrow:

- it uses an injected repository boundary;
- it does not create API routes;
- it does not render UI;
- it does not create auth or RBAC;
- it does not call tools;
- it does not call external services;
- it does not emit events;
- it does not execute replay;
- it does not create notifications;
- it does not create a broad audit service;
- it does not append audit logs outside the Phase 3A `AuditRecord` table;
- it does not export files;
- it does not generate PDFs;
- it does not create downloadable artifacts;
- it does not store raw document content.

The slice exists to prove that approval decisions and minimal audit trail records can move through the Phase 3B repository layer after the Phase 3C persisted governed flow harness creates a pending approval.
