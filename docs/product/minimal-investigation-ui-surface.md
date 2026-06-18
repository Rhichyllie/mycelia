# Minimal Investigation UI Surface

Phase 3F created the first minimal investigation UI surface for MYCELIA.
Phase 3G connects that surface to a narrow investigation selection read-only
boundary.

The route `/mycelia/investigation` now resolves a controlled investigation
target, loads through the Phase 3E persisted investigation read model, maps the
result into the hardened UI contract and renders it read-only. The goal is to
let a human understand a governed run story visually without introducing
mutation, API routes, auth, replay or case-management workflow.

## Why This Comes After 3E

Phase 3E defined the repository-backed investigation read model and its
completeness behavior. Phase 3F hardened the visual contract around the same
sections. Phase 3G keeps that contract and adds controlled target selection
before the read-model loader:

- overview;
- state timeline;
- policy/admission;
- approval;
- audit trail;
- persistence coverage;
- findings;
- next actions.

## Static Surface Architecture

The surface is split into:

- descriptor contract and record-kind invariants;
- safe static fixtures;
- read-only source records for the controlled reference case;
- selection boundary that resolves controlled or explicit run-scope targets;
- loader that calls the Phase 3E read model;
- mapper from read model to UI contract;
- presentation normalization for missing, incomplete and blocked states;
- semantic React rendering;
- route safety tests for the App Router page.

The route remains thin: it resolves a target through the selection boundary and
passes the mapped descriptor into the surface component.

## Read-Only Boundary

The UI is intentionally read-only. It does not accept state-changing input,
does not display controls that imply live mutation and does not expose storage
records directly to JSX.

Selection is also read-only. The boundary supports a controlled reference
target and a narrow tenant/run/correlation target shape. It does not create
search, listing, pagination or dashboard behavior.

It does not:

- create route-local database clients;
- call APIs;
- call fetch;
- instantiate PrismaClient;
- require auth or RBAC;
- execute replay;
- execute tools;
- emit events;
- create exports, PDFs or downloads.

## Data Safety

The fixture uses safe refs and safe summaries only. The renderer has explicit
states for missing, incomplete, blocked and not-reconstructed values.

It does not render raw document content, raw payloads, file blobs, binary
content, SQL details, stack traces, secrets or external service responses.

## UI Hardening

Phase 3F hardens:

- heading hierarchy and section landmarks;
- description-list patterns for scoped facts;
- ordered state timeline rendering;
- audit warning visibility;
- six-record persistence coverage;
- finding severities;
- empty states for missing audit, missing approval, partial coverage, no
  findings and no next actions;
- pilot/read-only boundary labeling.

## Relationship To 3E

The surface now calls the 3E read model through an injected read-only
repository client via the Phase 3G selection boundary. The default route uses a
controlled reference source, not a production database connection. This proves
the target-selection and read-model path without adding mutable runtime
behavior.

## Next Phase

Phase 3H adds a separate controlled request creation preview so the request
seed shape can be inspected before future live creation work. It should still
avoid auth/RBAC expansion, replay execution, exports, broad audit services,
workflow builder scope and SaaS dashboard scope unless explicitly planned.

Phase 3I adds a controlled approval decision preview. It remains separate from
the investigation UI and does not make approvals live or mutating.

Phase 3J uses the investigation route as the review step in deterministic demo
scenario seeds. It does not add replay, export, mutation, broad dashboard scope
or a new investigation route.
