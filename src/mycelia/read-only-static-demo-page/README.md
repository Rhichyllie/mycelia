# Read-Only Static Demo Page

This module contains the first read-only static demo page surface for MYCELIA.

It renders a safe in-memory view model from the existing human-readable static demo preview. The page is descriptor-level only: it presents the static demo title, summary, section list, plain text preview and non-goals without executing any runtime behavior.

It does not execute runtime work, persist data, call APIs, call tools, call external services, export files, generate PDFs or create downloadable artifacts.

The repository has no tracked `app/` or `pages/` routing convention at this phase, so this module is a pure TSX view component under `src/mycelia/` rather than a Next route.
