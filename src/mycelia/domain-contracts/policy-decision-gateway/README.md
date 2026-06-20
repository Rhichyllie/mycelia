# MYCELIA Policy Decision Gateway

This module contains the Phase 1E PolicyDecisionGateway type skeleton.

It defines pure TypeScript contracts for policy actions, governed resources,
declared purposes, obligations, policy decision requests, policy decisions,
safe denials, and fail-closed helper checks.

## What This Module Does

- Validates safe policy action identifiers.
- Defines tenant, workspace, and project scoped resource descriptors.
- Defines shallow obligation descriptors such as audit emission, approval,
  human review, redaction, evidence capture, and replay suppression.
- Defines policy decision request and decision shapes.
- Provides Result-returning helper checks that fail closed for missing,
  malformed, inconclusive, or non-allowing decisions.

## What This Module Does Not Do

- No real policy engine.
- No policy rule evaluation.
- No approval workflow.
- No obligation execution.
- No event emission.
- No runtime lifecycle implementation.
- No database, Prisma, API route, authorization middleware, RLS, or UI.

This module exists only to define safe request and decision contracts that
future governance infrastructure can consume.
