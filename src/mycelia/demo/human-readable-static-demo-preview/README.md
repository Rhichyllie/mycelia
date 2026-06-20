# Human-Readable Static Demo Preview

This module builds the first human-readable MYCELIA static demo preview from the existing descriptor chain.

It is pure TypeScript, in-memory only, read-only, non-executing, non-persistent and non-exporting. It validates the first static demo descriptor set, renders the `StaticDemoArtifact` through the safe plain-text renderer, and wraps the result in a customer-safe preview descriptor.

It does not render UI, render HTML, generate markdown files, export files, create downloadable artifacts, generate PDFs, execute runtime work, simulate replay, persist, emit events, call APIs, call tools or call external services.

Example preview text:

```text
MYCELIA Static Demo Artifact

Title: First static demo artifact
Summary: A customer safe static descriptor for MYCELIA.
Artifact Kind: EXECUTIVE_WALKTHROUGH
Exposure: CUSTOMER_SAFE
Data Classification: PUBLIC

Sections:
1. Scenario overview
   Kind: SCENARIO_OVERVIEW
   Summary: A safe governed operation story is presented.
```

This example is static documentation only. It is a descriptor-level preview and does not imply runtime execution, replay, persistence, UI rendering, export or deployment.
