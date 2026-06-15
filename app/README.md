# MYCELIA App Router Surface

The `/` route is the MYCELIA home entry surface. The `/mycelia` route is the static product information hub, `/mycelia/static-demo` is the current read-only static demo product surface, `/mycelia/roadmap` is the static roadmap surface, and `/mycelia/walkthrough` is the static guided walkthrough surface.

The App Router layout uses the shared product surface shell from `src/mycelia/product-surface-shell/` to provide MYCELIA branding, internal navigation, safety badges and a static product-preview note across product routes.

These routes are static, read-only and descriptor-level. They do not execute runtime work, persist data, call APIs, call tools, call external services, export files, generate PDFs or create downloadable artifacts.
