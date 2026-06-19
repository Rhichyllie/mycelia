# AuditRecord

Phase 1L defines pure typed audit record and evidence reference descriptors for
MYCELIA.

This module validates safe tenant-scoped audit descriptors for
governance-relevant runtime decisions, coordination outcomes, state descriptors,
policy decisions, and boundary checks.

It is not an evidence store. It does not persist records, emit events, seal
records, sign records, hash-chain records, export compliance data, or implement
observability pipelines.

The module exists only to define safe tenant-scoped audit descriptors that
future audit storage and compliance layers must respect.
