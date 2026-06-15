# Read-Only Static Demo Page

This module contains the read-only static demo product surface for MYCELIA.

It renders a safe in-memory view model from the existing human-readable static demo preview. The page is descriptor-level only: it presents the static demo title, summary, route status, safety badges, section overview, plain-text preview and non-goals without executing any runtime behavior.

It does not execute runtime work, persist data, call APIs, call tools, call external services, export files, generate PDFs, create downloadable artifacts or simulate replay.

The App Router route at `app/mycelia/static-demo/page.tsx` imports this view directly. The view remains static, read-only and non-executing.
