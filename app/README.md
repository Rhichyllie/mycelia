# MYCELIA App Router Surface

The `/` route is the first MYCELIA home entry surface. It links internally to `/mycelia/static-demo`, the current read-only static demo product surface.

The App Router layout uses the shared product surface shell from `src/mycelia/product-surface-shell/` to provide MYCELIA branding, internal navigation, safety badges and a static product-preview note across product routes.

These routes are static, read-only and descriptor-level. They do not execute runtime work, persist data, call APIs, call tools, call external services, export files, generate PDFs or create downloadable artifacts.
