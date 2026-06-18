# Pilot Demo End-to-End

Phase 3K adds a controlled pilot demo walkthrough at `/mycelia/demo`.

It follows Phase 3J because the demo scenario seed package now defines safe,
deterministic pilot scenarios. Phase 3K renders those seeds as a guided journey
across the existing controlled surfaces instead of adding runtime behavior.

## Purpose

The walkthrough connects:

- governed request draft;
- policy/admission expectation;
- approval decision preview;
- audit expectation;
- investigation review.

The default visible demo uses the medium-risk approval-required scenario because
it shows request creation, policy/admission, human approval, audit expectation
and investigation in one coherent path.

## Route

The route is:

- `/mycelia/demo`

It links only to existing controlled MYCELIA routes:

- `/mycelia/request/new`;
- `/mycelia/approval/decision`;
- `/mycelia/investigation`.

## Demo Contract

The presenter produces:

- `pilotDemoId`;
- `selectedScenarioId`;
- `demoTitle`;
- `targetAudience`;
- `demoThesis`;
- `scenarioSummary`;
- `stepCards`;
- `routeLinks`;
- `expectedGovernancePath`;
- `safetyBoundary`;
- `demoReadiness`;
- `presenterScript`;
- `nextActions`.

Demo readiness statuses are:

- `PILOT_DEMO_READY`;
- `PILOT_DEMO_INCOMPLETE`;
- `PILOT_DEMO_BLOCKED`;
- `PILOT_DEMO_FAILED_SAFE`.

Each step card includes step kind, title, safe summary, route path, status,
expected outcome, what to say and what not to claim.

## Included Paths

The surface and presenter cover at least:

- medium-risk approval required;
- rejected approval path;
- high-risk blocked/rejected path;
- incomplete evidence path.

The presenter also blocks invalid route paths, unsupported step kinds and
unsafe raw-content-like input.

## Presenter Script

The presenter script is a safe set of talking points for the demo operator. It
explains what can be claimed at each step and what must not be claimed. This is
deliberate: the walkthrough should make the current controlled product state
clear without implying live runtime, live approval action or replay execution.

## Safety Boundary

Phase 3K does not execute runtime, persist data, create API routes, create
auth/RBAC behavior, execute replay, create export/download/PDF artifacts, call
external services, create broad workflow builder behavior, create dashboard
search/listing or expand into SaaS scope.

The walkthrough uses safe references and safe summaries only. Raw document
content, raw payloads, binary blobs, SQL details, stack traces, secrets and
external service responses are outside the contract.

## Next Phase

The next phase can decide whether to make the demo scenario selector explicit
or add a narrow operator handoff around the existing controlled surfaces. It
should still avoid live mutation, API/auth expansion, replay execution, export
behavior, broad workflow builder scope and SaaS expansion unless explicitly
planned.
