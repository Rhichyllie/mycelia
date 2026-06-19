# MYCELIA Replay Dry-Run Descriptor v1

This module defines deterministic replay dry-run descriptor v1 logic for the minimal governed runtime slice.

It is pure TypeScript and in-memory. It assembles a descriptor from supplied investigation, lifecycle, policy/admission, approval, audit-boundary and persistence-reference descriptors.

Safety boundary:

- It does not execute runtime.
- It does not execute replay.
- It does not persist.
- It does not query databases.
- It does not call APIs.
- It does not call tools.
- It does not call external services.
- It does not emit events.
- It does not write audit records.
- It does not append logs.
- It does not render UI.
- It does not export files.
- It does not generate PDFs.
- It does not create downloadable artifacts.

This module exists to guide future replay UI and runtime service implementation. It does not infer hidden evidence from absent descriptors and does not claim replay happened.
