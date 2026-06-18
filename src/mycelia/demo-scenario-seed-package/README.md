# Demo Scenario Seed Package

Phase 3J defines deterministic demo scenario seeds for the governed
compliance/document review pilot path.

This module connects the controlled request creation surface, approval decision
surface and investigation surface into one safe demo narrative. It defines
scenario contracts, fixtures, presenter normalization and a package descriptor.

It does not execute runtime work. It does not persist data. It does not create
API routes, auth, RBAC, replay, export/download/PDF behavior, workflow builder
behavior, broad dashboard/list/search behavior, external integrations or SaaS
expansion.

The package uses safe references and safe summaries only. Raw document content,
raw payloads, binary blobs, SQL details, stack traces and secrets are outside
the accepted contract.
