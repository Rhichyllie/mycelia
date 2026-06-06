# MYCELIA Documentation Index

This repository separates canonical MYCELIA architecture from historical MapIA
reference material and implementation scaffolding.

## Directory Roles

| Path | Role |
|---|---|
| `docs/mycelia/` | Canonical MYCELIA architecture documents. Future implementation decisions must start here. |
| `docs/architecture/` | Implementation alignment registry and scaffolding. This folder is not canonical architecture. |
| `docs/adrs/` | Future Architectural Decision Records. ADRs document approved decisions; they do not bypass canonical documents. |
| `docs/mapia/` | Reference-only historical MapIA material. |
| `legacy/` | Reference-only legacy implementation material, including quarantined MapIA snapshots. |
| `contracts/` | Placeholder contract registry roots for future schemas and contract files. |

## Operating Rule

Future implementation must follow Document 19:

`docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md`

MapIA material must not be treated as the active MYCELIA runtime foundation.
MapIA files may be read for historical context only, and any reuse requires
explicit architecture review.
