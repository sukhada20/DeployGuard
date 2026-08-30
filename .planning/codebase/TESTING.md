# Testing Patterns

**Analysis Date:** 2026-08-22

## Test Framework

**Runner:**
- No repository test runner is configured. No `package.json`, Jest/Vitest configuration, pytest configuration, or test-specific dependency manifest is detected.
- The implementation is CommonJS/Node-oriented under `\.github/scripts` and `\.github/gsd-core/bin`, but no executable test suite is present in the tracked repository surface.

**Assertion Library:**
- Not detected. No test files using `node:assert`, Jest, Vitest, Mocha, Chai, or another assertion library are present.

**Run Commands:**
```bash
# No project-defined test command is available.
# The workflow documentation uses npm test as a generic fallback only:
# .github/gsd-core/workflows/execute-phase/steps/regression-gate-run.md
```

## Test File Organization

**Location:**
- No `tests/`, `test/`, `__tests__/`, or E2E test directory is present.
- Test-related workflow references point to a conventional root-level `tests/` directory, but that convention is documentation-only in this checkout, including `\.github/gsd-core/workflows/update.md`.

**Naming:**
- No repository-established unit, integration, or E2E test naming pattern is detectable because no test files exist.
- `*.test.cjs` appears in workflow/reference prose as an expected future convention, for example `tests/update-context.test.cjs` in `\.github/gsd-core/workflows/update.md`.

**Structure:**
```
DeployGuard/
  .github/
    scripts/                 # implementation scripts; no co-located tests
    gsd-core/bin/lib/         # runtime implementation; no co-located tests
    gsd-core/workflows/       # workflow documentation
  .planning/codebase/         # generated repository maps
```

## Test Structure

**Suite Organization:**
- No actual suite or test case structure is present.
- For future pure-function tests, preserve the implementation seam already supported by `require.main === module` guards and named exports in `\.github/scripts/changeset/lint.cjs` and `\.github/scripts/lib/cli-exit.cjs`.

**Patterns:**
- Setup, teardown, fixtures, and arrange/act/assert conventions are not established by executable tests.
- The strongest testable units are pure functions such as `evaluateLint`, `findPrFieldDrift`, `parseCoverage`, and `normalizeTestCommand` in `\.github/scripts/changeset/lint.cjs`, `\.github/gsd-core/bin/lib/coverage.cjs`, and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.

## Mocking

**Framework:**
- No mocking framework or test double library is configured.

**Patterns:**
```javascript
// No repository example exists.
```

**What to Mock:**
- Not defined. If tests are added, isolate filesystem, child-process, environment, and stderr/stdout boundaries around `main` functions in `\.github/scripts/changeset/lint.cjs` and `\.github/gsd-core/bin/lib/config-loader.cjs`.

**What NOT to Mock:**
- Keep pure parsing, classification, path-confinement, and normalization helpers real; these are the behavior-bearing units in `\.github/scripts/lib/drift-scan.cjs`, `\.github/gsd-core/bin/lib/coverage.cjs`, and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.

## Fixtures and Factories

**Test Data:**
- No test fixtures or factories are present.
- Reference fixtures exist for coverage-analysis examples under `\.github/gsd-core/references/edge-probe-fixtures`, but they are documentation/reference inputs rather than a runnable test fixture suite.

**Location:**
- No established fixtures directory is detected.

## Coverage

**Requirements:**
- No line, branch, function, or statement coverage target is configured.
- No CI coverage gate is present because no GitHub Actions workflow files or project manifest are detected.

**Configuration:**
- No c8, nyc, Istanbul, Jest, Vitest, or other coverage configuration is detected.
- The repository's `coverage` implementation module in `\.github/gsd-core/bin/lib/coverage.cjs` is domain logic for UAT routing, not a code-coverage collector.

**View Coverage:**
```bash
# No coverage command or report location is defined.
```

## Test Types

**Unit Tests:**
- Not present. Pure helper exports provide a natural future unit-test boundary in `\.github/scripts/changeset/lint.cjs`, `\.github/scripts/lib/drift-scan.cjs`, and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.

**Integration Tests:**
- Not present. CLI wrappers and filesystem/git adapters would require integration coverage around `\.github/scripts/changeset/lint.cjs` and `\.github/gsd-core/bin/lib/config-loader.cjs`.

**E2E Tests:**
- Not present. No application UI or browser test harness is detected.
- Workflow-level verification is described in `\.github/gsd-core/workflows/verify-work.md` and `\.github/gsd-core/workflows/execute-phase.md`, but those documents do not constitute executable E2E tests.

## Common Patterns

**Async Testing:**
- No executable async test pattern is present. The CLI boundary supports sync or async `main` functions through `runMain` in `\.github/scripts/lib/cli-exit.cjs`, which should be covered when a runner is introduced.

**Error Testing:**
- No executable error assertions are present. Future tests should cover structured failures and fail-closed paths, including `ExitError` translation in `\.github/scripts/lib/cli-exit.cjs`, malformed coverage handling in `\.github/gsd-core/bin/lib/coverage.cjs`, and unreadable/broken-link handling in `\.github/scripts/lib/drift-scan.cjs`.

---

*Testing analysis: 2026-08-22*
*Update when test infrastructure or coverage policy changes*
