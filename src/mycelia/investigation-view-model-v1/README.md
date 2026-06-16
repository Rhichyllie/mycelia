# MYCELIA Investigation View Model v1

This module defines deterministic investigation view model v1 logic for the minimal governed runtime slice.

It assembles a safe descriptor from provided lifecycle, policy/admission, approval, audit-boundary and persistence-reference descriptors. It is pure TypeScript and in-memory.

Safety boundary:

- It does not execute runtime.
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

This module exists to guide future investigation UI and runtime service implementation. It does not infer hidden facts from absent descriptors.
