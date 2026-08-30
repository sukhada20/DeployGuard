# Coding Conventions

**Analysis Date:** 2026-08-22

## Naming Patterns

**Files:**
- The repository implementation surface uses lowercase kebab-case names with `.cjs` extensions, for example `\.github/scripts/lib/cli-exit.cjs` and `\.github/gsd-core/bin/lib/config-loader.cjs`.
- Test-file naming is not established: no `*.test.*`, `*.spec.*`, or dedicated test files are present.

**Functions:**
- Use camelCase for functions, including `runMain`, `evaluateLint`, `findPrFieldDrift`, and `normalizeTestCommand` in `\.github/scripts/lib/cli-exit.cjs`, `\.github/scripts/changeset/lint.cjs`, and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.
- Prefer named pure helpers for parsing, validation, classification, and verdict computation.

**Variables:**
- Use camelCase for locals and parameters, such as `changedFiles`, `fragmentFailures`, and `realPrNumber` in `\.github/scripts/changeset/lint.cjs`.
- Use UPPER_SNAKE_CASE for module constants, such as `LINT_REASON`, `USER_FACING_PREFIXES`, and `MAX_COMMAND_LENGTH` in `\.github/scripts/changeset/lint.cjs` and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.
- Underscore-prefixed names mark internal/test seams, for example `_capabilityRegistry` and `_resetFederatedRegistryForTests` in `\.github/gsd-core/bin/lib/config-loader.cjs`.

**Types:**
- Runtime JavaScript uses classes for custom errors, such as `ExitError` in `\.github/scripts/lib/cli-exit.cjs`, and frozen objects for enum-like values, such as `LINT_REASON` in `\.github/scripts/changeset/lint.cjs`.
- TypeScript source is not present in the repository tree; generated CommonJS mirrors contain JSDoc type annotations where useful.

## Code Style

**Formatting:**
- Use strict mode (`'use strict';` or `"use strict";`) in CommonJS modules.
- Use semicolons, braces, trailing commas in multiline calls/objects, and two-space indentation in authored scripts such as `\.github/scripts/changeset/lint.cjs`; generated files under `\.github/gsd-core/bin/lib/` may use compact one-line control statements.
- Prefer Node built-in imports via `require('node:...')` and relative CommonJS `require()` calls.
- No Prettier, Biome, EditorConfig, or formatting configuration file is detected.

**Linting:**
- No project-level ESLint/Biome configuration or package manifest is detected.
- Code comments indicate lint expectations such as avoiding `process.exit()` and suppressing specific TypeScript require rules in `\.github/scripts/lib/cli-exit.cjs` and `\.github/gsd-core/bin/lib/config-loader.cjs`, but no runnable lint command is defined in this repository.

## Import Organization

**Order:**
1. Node built-ins, commonly `node:fs`, `node:path`, and `node:child_process`.
2. Local relative modules.
3. Destructuring of imported module APIs near the require site.

**Grouping:**
- Keep built-ins and local dependencies in separate contiguous groups where the file has multiple imports, as shown in `\.github/scripts/changeset/lint.cjs` and `\.github/gsd-core/bin/lib/config-loader.cjs`.

**Path Aliases:**
- No path aliases are detected. Modules use relative paths such as `../lib/cli-exit.cjs` in `\.github/scripts/changeset/lint.cjs`.

## Error Handling

**Patterns:**
- Throw at an operation boundary when an expected prerequisite fails, then translate failures at the CLI boundary with `runMain` in `\.github/scripts/lib/cli-exit.cjs`.
- Catch expected filesystem, parsing, symlink, and external-command failures locally when the safe behavior is to skip, degrade, or return a structured failure, as in `\.github/scripts/lib/drift-scan.cjs` and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.
- Prefer fail-closed behavior for validation and security-sensitive scans: malformed coverage becomes human-reviewed, unreadable changeset fragments fail validation, and unsafe paths are skipped in `\.github/gsd-core/bin/lib/coverage.cjs`, `\.github/scripts/changeset/lint.cjs`, and `\.github/scripts/lib/drift-scan.cjs`.

**Error Types:**
- Use `ExitError` for deliberate CLI exit status plus an optional user-facing message in `\.github/scripts/lib/cli-exit.cjs`.
- Return structured result objects for pure validation/classification APIs, for example `{ ok, reason }` from `evaluateLint` in `\.github/scripts/changeset/lint.cjs` and `{ found, entries, malformed }` from `parseCoverage` in `\.github/gsd-core/bin/lib/coverage.cjs`.

## Logging

**Framework:**
- Use `process.stdout.write` for successful machine-readable or concise CLI output and `process.stderr.write` for errors/warnings in `\.github/scripts/changeset/lint.cjs` and `\.github/scripts/lib/cli-exit.cjs`.

**Patterns:**
- Keep pure helpers free of output; emit human-readable diagnostics in CLI wrappers.
- Include contextual file names, reason codes, and remediation text in boundary errors, as shown in `\.github/scripts/changeset/lint.cjs`.

## Comments

**When to Comment:**
- Explain why a security, compatibility, performance, or fail-safe decision exists, rather than restating syntax; examples include the root-confinement rationale in `\.github/scripts/lib/drift-scan.cjs` and the one-shot test-command rationale in `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.
- Comments commonly include issue or ADR references, such as `#2988`, `#3180`, and `ADR-857` in `\.github/scripts/changeset/lint.cjs`, `\.github/scripts/lib/drift-scan.cjs`, and `\.github/gsd-core/bin/lib/config-loader.cjs`.

**JSDoc/TSDoc:**
- Document exported helpers and non-obvious contracts with JSDoc, including parameters, return shapes, and safety constraints in `\.github/scripts/lib/cli-exit.cjs` and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.

**TODO Comments:**
- No application TODO convention is established. Existing implementation comments use issue/ADR identifiers for tracked rationale in `\.github/scripts` and `\.github/gsd-core/bin/lib`.

## Function Design

**Size:**
- Extract pure predicates, parsers, scanners, and classifiers into small named functions; complex orchestration remains in a `main` wrapper, as in `\.github/scripts/changeset/lint.cjs`.

**Parameters:**
- Use an options object for functions with several related inputs, such as `evaluateLint({ changedFiles, labels, ... })` in `\.github/scripts/changeset/lint.cjs` and `scanTree({ root, scanDirs, scanExt, onFile })` in `\.github/scripts/lib/drift-scan.cjs`.

**Return Values:**
- Return explicit values and structured result objects; use early returns for invalid, absent, or already-safe cases in `\.github/gsd-core/bin/lib/coverage.cjs` and `\.github/gsd-core/bin/lib/normalize-test-command.cjs`.

## Module Design

**Exports:**
- Prefer named CommonJS exports for reusable helpers and constants, as in `module.exports = { ExitError, runMain }` in `\.github/scripts/lib/cli-exit.cjs`.
- Guard executable entrypoints with `if (require.main === module)` so functions remain importable for tests, as in `\.github/scripts/changeset/lint.cjs`.

**Barrel Files:**
- No barrel/index export pattern is detected. Consumers require leaf modules directly, as documented in `\.github/gsd-core/bin/lib/config-loader.cjs`.

---

*Convention analysis: 2026-08-22*
*Update when patterns change*
