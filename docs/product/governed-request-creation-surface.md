# Governed Request Creation Surface

Phase 3H adds the first controlled request creation surface for MYCELIA.

The route is `/mycelia/request/new`. It renders a deterministic governed
request draft/seed preview for the governed compliance/document review path. It
comes after Phase 3G because the investigation surface can now resolve a
read-only target; the next product gap is showing how a request seed would be
framed before policy/admission, approval, audit and investigation.

## What It Renders

- request overview: draft reference, tenant ref, requester ref, resource ref,
  purpose, action type and request mode;
- governance preview: risk hint, expected policy/admission outcome, approval
  expectation and expected approval role;
- safety boundary: no live DB write, API, auth, replay, export, tool execution
  or external call;
- expected run path: request draft, policy/admission, approval when required,
  audit and investigation;
- request seed summary;
- warnings for incomplete, blocked or failed-safe drafts;
- next actions for future live creation planning.

## Contract

The UI contract is split across:

- `governed-request-creation-contract.ts`
- `governed-request-creation-fixtures.ts`
- `governed-request-creation-presenter.ts`
- `governed-request-creation-surface.tsx`

Status values are:

- `REQUEST_DRAFT_READY`
- `REQUEST_DRAFT_INCOMPLETE`
- `REQUEST_DRAFT_BLOCKED`
- `REQUEST_DRAFT_FAILED_SAFE`

The contract accepts safe references and safe summaries only. Raw document
content, raw payloads, file blobs, binary values, SQL details and stack traces
are not accepted.

## Fixtures

The controlled fixtures cover:

- low-risk document review request;
- medium-risk approval-required document review request;
- high-risk blocked/rejected request;
- incomplete request draft;
- unsafe raw-content attempt;
- unsupported action type.

They are not live seed data and do not persist anything.

## Out Of Scope

This phase does not create live request persistence, API routes, auth, RBAC,
notifications, Postgres support, billing, replay execution, a workflow builder,
export/PDF/download behavior, an event store, audit sealing, broad dashboard
search/listing or SaaS expansion.

## Next Phase

Phase 3I adds a controlled approval decision UI surface so a required approval
can be reviewed visually before any live approval action exists. It remains
non-mutating and does not introduce API routes, auth/RBAC, broad approval inbox
or workflow builder behavior.

Phase 3J connects this request seed preview with approval and investigation
previews through deterministic demo scenario seeds. It does not persist request
records or create a live request workflow.
