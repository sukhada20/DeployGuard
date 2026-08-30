# Phase 1: Project Foundation & Simulation Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-29
**Phase:** 01-project-foundation-simulation-layer
**Areas discussed:** Stub Fidelity

---

## Stub Fidelity

### Q1: How realistic should stubs be?

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic + injectable | Stubs stay instant and predictable by default, but accept injected failure/latency scenarios via constructor params | ✓ |
| Minimal as-is | Keep current stubs that return canned data instantly; error/latency simulation deferred to Phase 2+ | |
| Realistic simulation | Add randomized latency, occasional failures, and rate limiting now | |

**User's choice:** Deterministic + injectable
**Notes:** Lets Phase 2+ tests exercise error paths without making Phase 1 stubs heavy.

### Q2: Should stubs share a formal interface with future real GCP clients?

| Option | Description | Selected |
|--------|-------------|----------|
| Protocol classes (typing.Protocol) | Define abstract interfaces like MetricsSource, DeploymentService, LogStore, DocumentStore | ✓ |
| ABC interfaces | Use abc.ABC base classes for each cloud service | |
| Duck typing only | No formal interface; same method signatures by convention | |

**User's choice:** Protocol classes (typing.Protocol)
**Notes:** Agents depend on the protocol, not the concrete class.

### Q3: How should fake data be managed?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixture-file driven | Load fake data from JSON/YAML fixture files; reusable across tests and demo scenarios | ✓ |
| Hardcoded in stub classes | Each stub has fake data built-in | |
| Factory functions | Factory helpers that configure stubs with specific data | |

**User's choice:** Fixture-file driven
**Notes:** New scenarios require only a new fixture file, no code changes.

### Q4: Should stubs be async from the start?

| Option | Description | Selected |
|--------|-------------|----------|
| Async stubs with sync fallback | Stub methods are async def, internally synchronous; sync wrapper for tests | ✓ |
| Sync stubs now, async later | Keep current sync methods; convert later | |
| Both sync and async | Expose both sync and async variants | |

**User's choice:** Async stubs with sync fallback
**Notes:** Agents use await from the start, avoiding a future migration.

---

## Agent's Discretion

None — user provided explicit decisions on all questions.

## Deferred Ideas

None — discussion stayed within phase scope.
