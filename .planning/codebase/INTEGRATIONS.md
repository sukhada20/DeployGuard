# External Integrations

**Analysis Date:** 2026-08-22

## Repository Status

The repository is sparse and contains GSD/VSC workflow configuration rather than an application. No application code, dependency manifests, service clients, endpoints, or deployment definitions are detected.

## APIs & External Services

**Application APIs:**
- Not detected - no source implementation or API client configuration is present.

**Third-party services:**
- Not detected - no SDK imports, service URLs, webhook definitions, or provider configuration are present.

## Data Storage

**Databases:**
- None detected.
  - Connection: Not applicable.
  - Client: Not detected.

**File Storage:**
- Local repository files only, including workflow assets under `.github/`.
- No cloud or external file-storage integration is detected.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Not detected.
  - Implementation: No application authentication or identity code is present.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- No application logging implementation is present. GSD metadata such as `.github/gsd-install-state.json` records local installation state, not runtime observability.

## CI/CD & Deployment

**Hosting:**
- Not detected - no hosting, container, deployment, or infrastructure configuration is present.

**CI Pipeline:**
- Not detected - no CI workflow files or pipeline manifests are present.

## Environment Configuration

**Required env vars:**
- None detected. No application environment contract is present.

**Secrets location:**
- Not detected. No secret values were inspected.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

## Repository Tooling Integrations

- `.github/copilot-instructions.md` configures GitHub Copilot/GSD behavior for this workspace.
- `.github/skills/`, `.github/agents/`, `.github/hooks/`, and `.github/gsd-core/` provide local workflow assets. They are repository tooling, not application-level external service integrations.

---

*Integration audit: 2026-08-22*
