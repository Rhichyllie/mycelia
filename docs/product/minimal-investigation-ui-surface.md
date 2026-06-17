# Minimal Investigation UI Surface

Phase 3F created the first minimal investigation UI surface for MYCELIA.
Phase 3G-A connects that surface to a narrow live read-only persisted
investigation read-model loader.

The route `/mycelia/investigation` now loads through the Phase 3E persisted
investigation read model, maps the result into the hardened UI contract and
renders it read-only. The goal is to let a human understand a governed run
story visually without introducing mutation, API routes, auth, replay or
case-management workflow.

## Why This Comes After 3E

Phase 3E defined the repository-backed investigation read model and its
completeness behavior. Phase 3F hardened the visual contract around the same
sections. Phase 3G-A keeps that contract and changes the source path from
renderer fixture to read-model loader:

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
- loader that calls the Phase 3E read model;
- mapper from read model to UI contract;
- presentation normalization for missing, incomplete and blocked states;
- semantic React rendering;
- route safety tests for the App Router page.

The route remains thin: it loads a descriptor through the read-only loader and
passes the mapped descriptor into the surface component.

## Read-Only Boundary

The UI is intentionally read-only. It does not accept state-changing input,
does not display controls that imply live mutation and does not expose storage
records directly to JSX.

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
repository client. The default route uses a controlled reference source, not a
production database connection. This proves the read-model path without adding
mutable runtime behavior.

## Next Phase

The next phase can replace the controlled reference source with a narrowly
scoped production read-only repository client. That future phase should still
avoid auth/RBAC expansion, replay execution, exports, broad audit services and
SaaS dashboard scope unless explicitly planned.
