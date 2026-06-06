# MYCELIA

MYCELIA is in Phase 0 bootstrap. The active runtime, API, database schema, and
product UI have not started.

The former active MapIA-derived implementation was quarantined under
`legacy/mapia-active-snapshot/` and is reference-only. It must not be used as the
MYCELIA runtime foundation without explicit architecture review.

Canonical architecture lives in `docs/mycelia/`. Implementation alignment
scaffolding lives in `docs/architecture/`. Contract registry placeholders live
in `contracts/`.

## Safe Phase 0 Command

```bash
pnpm validate:phase0
```

This runs the current lint, typecheck, no-active-tests Vitest baseline, and
documentation/registry presence check.

## Guarded Commands

`pnpm dev`, `pnpm build`, and `pnpm start` are intentionally guarded for now.
They do not start Next.js because the active app shell has not been rebuilt.

Future implementation work must follow
`docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`.
Do not revive MapIA as the active MYCELIA foundation.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
