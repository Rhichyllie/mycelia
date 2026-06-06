# GitHub Automation

GitHub automation is currently Phase 0 only.

The active workflow is `.github/workflows/phase0-ci.yml`. It validates the
repository with the safe Phase 0 baseline and intentionally does not run product
builds, Prisma migrations, deployment steps, or runtime commands.

Future workflows must follow Document 19 and the MYCELIA architecture
constitution in `docs/mycelia/`.
