# Governed Request Creation Surface

This module defines the Phase 3H controlled governed request creation surface.

It renders a deterministic, read-only request seed preview for the governed
compliance/document review path. It separates the contract, fixtures, presenter
and renderer so future live request creation can reuse the UI boundary without
leaking storage/runtime details into JSX.

This module does not create API routes, persist records, call PrismaClient, query
databases, execute runtime work, execute replay, call tools, call external
services, emit events, create export/download/PDF behavior, or revive retired source.
