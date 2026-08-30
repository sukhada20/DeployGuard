---
status: testing
phase: 01-project-foundation-simulation-layer
source: 
  - 01-01-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-05-SUMMARY.md
started: 2026-08-23T10:00:00Z
updated: 2026-08-23T10:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch using `make dev`. Server boots without errors, and a GET request to `http://localhost:8000/health` returns live health data with version 0.1.0.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch using `make dev`. Server boots without errors, and a GET request to `http://localhost:8000/health` returns live health data with version 0.1.0.
result: [pending]

### 2. Agent Registry API Returns Seed Data
expected: When running the server, a GET request to `http://localhost:8000/api/v1/registry/agents` returns a JSON list of 5 seeded agents (including the 'rollback-v1' critical agent).
result: [pending]

### 3. Developer Verification Suite
expected: Running `make verify` from the root directory executes the ruff formatter, ruff linter, mypy type checker, and pytest suite, completing with "All checks passed! ✨".
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0

## Gaps

