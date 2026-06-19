# Demo Local Preview

Phase 3L defines the local-only preview contract for controlled MYCELIA demo
inspection.

The module is descriptive and testable only. It does not start a server, run
migrations, instantiate database clients, write persistence records, create API
routes, create auth/RBAC behavior, execute replay, export files or call
external services.

Use `pnpm demo:local` to inspect:

- `http://127.0.0.1:3000/mycelia`
- `http://127.0.0.1:3000/mycelia/demo`
- `http://127.0.0.1:3000/mycelia/request/new`
- `http://127.0.0.1:3000/mycelia/approval/decision`
- `http://127.0.0.1:3000/mycelia/investigation`
