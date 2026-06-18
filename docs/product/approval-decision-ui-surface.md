# Approval Decision UI Surface

Phase 3I adds the first controlled approval decision UI surface for MYCELIA.

The route is `/mycelia/approval/decision`. It renders a deterministic,
read-only approval decision preview for the governed compliance/document review
path. It comes after Phase 3H because the product can now show a controlled
request seed; the next visual step is showing how a required approval would be
reviewed and framed before any live approval action exists.

## What It Renders

- approval overview: preview ref, tenant ref, governed run ref, approval request
  ref, requester ref, approver role, resource ref and purpose;
- governance context: risk level, policy/admission outcome, why approval is
  required and safe summary;
- decision preview: available decision options, selected decision preview,
  decision reason preview and explicit non-mutating boundary;
- expected runtime effect: expected approval status, lifecycle state, audit
  moment and investigation consequence;
- safety boundary: no DB write, API, auth, replay, export, tool execution or
  external call;
- warnings for missing, unsupported, terminal, mismatched or unsafe previews;
- next actions for future live approval planning.

## Contract

The UI contract is split across:

- `approval-decision-ui-contract.ts`
- `approval-decision-ui-fixtures.ts`
- `approval-decision-ui-presenter.ts`
- `approval-decision-ui-surface.tsx`

Status values are:

- `APPROVAL_DECISION_PREVIEW_READY`
- `APPROVAL_DECISION_PREVIEW_INCOMPLETE`
- `APPROVAL_DECISION_PREVIEW_BLOCKED`
- `APPROVAL_DECISION_PREVIEW_FAILED_SAFE`

The contract accepts safe references and safe summaries only. Raw document
content, raw payloads, file blobs, binary values, SQL details and stack traces
are not accepted.

## Fixtures

The controlled fixtures cover:

- pending medium-risk approval;
- approved decision preview;
- rejected decision preview;
- cancelled decision preview;
- timed-out decision preview;
- missing approval request;
- unsupported decision option;
- already terminal approval;
- unsafe raw-content attempt.

They are not live approval tasks and do not persist anything.

## Out Of Scope

This phase does not create live approval persistence, API routes, auth, RBAC,
notifications, Postgres support, billing, replay execution, broad approval
inbox/task management, workflow builder, export/PDF/download behavior, event
store, audit sealing, broad dashboard search/listing or SaaS expansion.

## Next Phase

Phase 3J connects request creation, approval preview and investigation review
into a deterministic demo scenario seed package. It is still non-executing and
does not add live mutation, auth/RBAC expansion, broad inbox scope or workflow
builder behavior.
