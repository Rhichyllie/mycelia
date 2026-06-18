# Demo Scenario Seed Package

Phase 3J adds a deterministic demo scenario seed package for MYCELIA.

It follows Phase 3I because the product now has the three controlled pilot
surfaces needed for a coherent non-executing story:

- governed request creation at `/mycelia/request/new`;
- approval decision preview at `/mycelia/approval/decision`;
- investigation review at `/mycelia/investigation`.

## Purpose

The package defines safe scenario seeds for the governed compliance/document
review pilot path. It connects request seed, policy/admission expectation,
approval expectation, audit expectation and investigation expectation into one
controlled narrative.

It does not execute runtime, persist data, create API routes, create auth,
execute replay, call external services, create export/download/PDF behavior or
turn the demo path into SaaS.

## Scenario Contract

Each seed includes:

- `demoScenarioId`;
- `scenarioName`;
- `scenarioPurpose`;
- `targetBuyerContext`;
- `requestSeed`;
- `policyAdmissionExpectation`;
- `approvalExpectation`;
- `investigationExpectation`;
- `auditExpectation`;
- `routeSequence`;
- `presenterNotes`;
- `safetyWarnings`;
- `demoReadinessStatus`;
- `nextSteps`.

Readiness statuses are:

- `DEMO_SCENARIO_READY`;
- `DEMO_SCENARIO_INCOMPLETE`;
- `DEMO_SCENARIO_BLOCKED`;
- `DEMO_SCENARIO_FAILED_SAFE`.

Step kinds are:

- `REQUEST_CREATION`;
- `POLICY_ADMISSION`;
- `APPROVAL_DECISION`;
- `AUDIT_EXPECTATION`;
- `INVESTIGATION_REVIEW`.

## Included Scenarios

The package includes controlled seeds for:

- low-risk direct completion;
- medium-risk approval required;
- medium-risk rejected decision;
- cancelled approval path;
- timed-out approval path;
- high-risk blocked or rejected path;
- incomplete evidence path;
- unsafe raw-content attempt.

The unsafe attempt is used only to prove failed-safe handling. It is not
rendered as usable demo data.

## Route Sequence

Scenario routes are limited to:

- `/mycelia/request/new`;
- `/mycelia/approval/decision`;
- `/mycelia/investigation`.

The package does not create a new route, broad walkthrough UI, dashboard,
search/listing or workflow builder.

## Presenter Behavior

The presenter normalizes safe scenario data, validates route steps, rejects
unsupported step kinds, blocks invalid routes, marks missing expectations as
incomplete and fails safe on unsafe raw-content-like fields.

It uses safe references and safe summaries only. Raw document content, raw
payloads, binary blobs, SQL details, stack traces, secrets and external service
responses are outside the contract.

## Out Of Scope

Phase 3J does not implement live request persistence, live approval execution,
runtime execution, replay execution, API routes, auth/RBAC, notifications,
Postgres support, billing, broad workflow builder, broad audit service, event
store, audit sealing, export/PDF/download behavior or SaaS expansion.

## Next Phase

The next phase can use these deterministic seeds to create a narrow demo
navigation/walkthrough surface. That phase should still avoid mutation,
runtime execution, replay, export, broad search/listing and SaaS expansion
unless explicitly planned.
