# Persisted Investigation Read Model

This module defines deterministic persisted investigation read model logic for the minimal governed runtime slice.

It reconstructs investigation-ready descriptors from repository-backed records for `GovernedRun`, `RuntimeStateSnapshot`, `PolicyDecisionRecord`, `AdmissionDecisionRecord`, `ApprovalRequest` and `AuditRecord`.

Boundary:

- pure TypeScript orchestration over an injected repository client;
- reads through the runtime repository boundary;
- no UI rendering;
- no API routes;
- no auth or RBAC;
- no notifications;
- no replay execution;
- no tool execution;
- no external service calls;
- no export, PDF or downloadable artifact behavior;
- no broad audit service, audit sealing or event store;
- no global PrismaClient instantiation;
- no database connection at import time.

The module exists to make persisted governed runs explainable before the first investigation UI surface.
