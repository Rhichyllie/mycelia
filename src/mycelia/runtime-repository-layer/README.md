# Runtime Repository Layer

This module defines the Phase 3B runtime repository boundary for the minimal
governed runtime slice.

It uses dependency injection. It does not import PrismaClient, instantiate
database clients, create global clients or connect to a database at import time.

The layer validates safe inputs for the six Phase 3A persistence records and
wraps an injected structural client with fail-closed repository results. It does
not execute runtime, execute replay, call APIs, create UI, create auth, emit
events, write audit records as runtime behavior, append logs, call tools, call
external services, export files, generate PDFs or create downloadable artifacts.

It stores no raw sensitive document content and accepts only safe refs,
summaries and bounded record fields.

The module exists to guide Phase 3C Governed Request Runtime Flow without
bootstrapping production database clients in this phase.
