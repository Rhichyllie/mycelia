# Approval Decision UI Surface

This module defines the Phase 3I controlled approval decision UI surface.

It renders deterministic, read-only approval decision previews for the governed
compliance/document review path. It separates the contract, fixtures, presenter
and renderer so future live approval work can reuse the UI boundary without
leaking runtime or repository details into JSX.

This module does not create API routes, persist approval decisions, call
PrismaClient, query databases, execute Phase 3D runtime work, execute replay,
call tools, call external services, emit events, create export/download/PDF
behavior, create a broad approval inbox, or revive retired source.
