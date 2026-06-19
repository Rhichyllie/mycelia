# Persisted Governed Flow Harness

Phase 3C creates the first controlled persisted governed flow harness for the
governed compliance/document review slice.

The harness composes the Phase 3B repository layer with deterministic
lifecycle, policy/admission and audit-boundary descriptors. It persists and
reads back the six Phase 3A record types through an injected repository client.

It does not create API routes, render UI, create auth, execute replay, call
tools, call external services, create billing, create multi-tenancy admin,
revive MapIA or become a full runtime product surface.

The harness is deterministic. Scenario inputs supply safe identifiers and ISO
timestamps. The module does not generate identifiers, call timers, use random
values or infer hidden tenant/run state.

Records remain bounded to safe references and summaries. Raw document content,
raw payloads, file blobs, binary content, uploaded file bodies and raw external
service responses are rejected.

This module exists to prove the minimal persistence path before Phase 3D
Approval + Audit Runtime Slice.
