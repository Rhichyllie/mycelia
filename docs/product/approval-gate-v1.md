# Approval Gate v1

Phase 2V defines the first deterministic approval gate layer for the minimal MYCELIA runtime slice.

It is pure TypeScript and in-memory. It represents how approval-required admission outcomes are resolved, but it does not create an approval queue, approval UI, persistence, audit writing, event emission, runtime execution or API routes.

## Approval Statuses

- `PENDING`
- `APPROVED`
- `REJECTED`
- `TIMED_OUT`
- `CANCELLED`

## Decision Outcomes

- `APPROVE`
- `REJECT`
- `TIMEOUT`
- `CANCEL`

## Input Requirements

Approval gate v1 accepts bounded descriptor input only:

- tenant id;
- run id or correlation id;
- approval request id;
- requested role;
- requester reference;
- optional approver reference;
- current approval request status;
- decision outcome;
- decision reason code;
- safe decision summary;
- policy/admission outcome;
- risk level;
- optional safe shallow metadata.

It does not accept raw document content, unbounded payloads, arbitrary evidence blobs, external service results, full user profiles or raw approval comments.

## Deterministic Rules

- Invalid or unsafe input fails closed.
- A non-`PENDING` request cannot transition.
- A policy/admission outcome other than `REQUIRE_APPROVAL` cannot be resolved by the approval gate.
- `APPROVE` from `PENDING` with `REQUIRE_APPROVAL` becomes `APPROVED`.
- `REJECT` from `PENDING` with `REQUIRE_APPROVAL` becomes `REJECTED`.
- `TIMEOUT` from `PENDING` becomes `TIMED_OUT`.
- `CANCEL` from `PENDING` becomes `CANCELLED`.

## Lifecycle Mapping

- `APPROVED` maps to governed-run-lifecycle intent `APPROVE`.
- `REJECTED` maps to governed-run-lifecycle intent `REJECT`.
- `TIMED_OUT` maps to governed-run-lifecycle intent `FAIL_RUN`, because timeout is treated as an operational failure rather than a business rejection.
- `CANCELLED` maps to governed-run-lifecycle intent `CANCEL_RUN`.

## Audit Boundary Mapping

- Approval request creation maps conceptually to `APPROVAL_REQUESTED`.
- Approval decision outcomes map conceptually to `APPROVAL_DECIDED`.
- No audit records are written in this phase.

## Persistence Mapping

Approval gate decisions map conceptually to future first-slice records:

- `ApprovalRequest`;
- `AdmissionDecisionRecord`;
- `GovernedRun`;
- `RuntimeStateSnapshot`;
- future `AuditRecord`.

This phase does not persist those records.

## Fail-Closed Behavior

Invalid input, non-pending status and non-approval admission outcomes return safe denial descriptors. Denials do not include raw input payloads, sensitive metadata, tenant existence details or hidden approval state.

## Out of Scope

- runtime execution;
- persistence;
- DB access;
- Prisma migrations or generate;
- repository/service layer;
- API routes;
- authentication;
- approval UI;
- approval queue;
- event emission;
- audit writing;
- append log writing;
- workflow execution;
- tool execution;
- external services;
- replay execution;
- export/PDF/download behavior.

## Next Phases

Approval gate v1 provides the approval decision boundary needed before investigation and replay descriptor work. Future phases can use its descriptors when planning `2W Investigation View v1` without activating persistence, runtime execution, audit storage or UI prematurely.
