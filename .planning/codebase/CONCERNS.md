# Codebase Concerns

**Analysis Date:** 2026-08-22

## Tech Debt

**Missing DeployGuard implementation:**
- Issue: The repository contains `AGENTS.md` and the GSD workflow/tooling tree under `.github/`, but no DeployGuard application source, package manifest, README, or runtime entry point.
- Files: `AGENTS.md`, `.github/`
- Why: The repository is at a scaffold/setup stage.
- Impact: There is no product behavior to build, review, test, deploy, or performance-tune; application-level findings cannot be validated.
- Fix approach: Add the product source tree, a root manifest and lockfile, documented entry points, and a reproducible development command before treating this repository as an implemented application.

**Checked-in generated workflow framework without product boundary:**
- Issue: The repository is dominated by installed GSD agents, workflows, scripts, and manifests rather than project code.
- Files: `.github/gsd-core/`, `.github/agents/`, `.github/skills/`, `.github/gsd-file-manifest.json`, `.github/gsd-install-state.json`
- Why: The GSD installer has been applied directly to the otherwise empty repository.
- Impact: Tooling changes can be mistaken for DeployGuard implementation changes, and a future product may inherit a large maintenance surface without a clear ownership boundary.
- Fix approach: Keep framework updates isolated and documented, establish a product directory and build boundary, and verify installer manifests after upgrades.

## Known Bugs

**No runnable product surface:**
- Symptoms: There is no application command, source entry point, or test target to execute.
- Trigger: Attempting to build, run, or test DeployGuard from the repository root.
- Workaround: None; initialize the product first.
- Root cause: No application implementation or package configuration is present in the repository root.
- Files: `AGENTS.md`, `.github/`

## Security Considerations

**Security posture is undefined for the intended product:**
- Risk: Authentication, authorization, input validation, secret handling, dependency policy, transport security, and data protection cannot be reviewed because no product code or deployment configuration exists.
- Current mitigation: No product-level controls are detectable. The repository does include GSD security-auditor workflow definitions under `.github/agents/`, but those are process guidance, not runtime controls.
- Recommendations: Define the application trust boundaries and threat model, add dependency and secret scanning to CI, document required environment variables without committing values, and implement server-side authorization before exposing any data or deployment action.
- Files: `.github/agents/gsd-security-auditor.agent.md`, `.github/gsd-core/references/security-asvs-levels.md`

**Checked-in tooling executes local build and workflow commands:**
- Risk: The GSD runtime can invoke TypeScript compilation and other workflow operations from checked-in scripts; an untrusted or tampered checkout could execute code with the developer's local permissions.
- Current mitigation: Runtime behavior is centralized in `.github/gsd-core/bin/ensure-runtime-build.cjs`, and the repository tracks installation metadata in `.github/gsd-install-state.json`.
- Recommendations: Pin and review framework updates, verify release integrity before installation, run workflow tooling with least privilege, and keep repository write/execute permissions restricted in CI.
- Files: `.github/gsd-core/bin/ensure-runtime-build.cjs`, `.github/gsd-core/bin/gsd-tools.cjs`, `.github/scripts/`

## Performance Bottlenecks

**Runtime auto-build on an unbuilt checkout:**
- Problem: When the compiled runtime sentinel is absent, the tooling synchronously waits on a lock and runs TypeScript compilation before commands can proceed.
- Measurement: The default peer-build wait timeout is 120 seconds; no product workload benchmarks exist.
- Cause: Compiled `.github/gsd-core/bin/lib/` output may be absent from a raw checkout, so `.github/gsd-core/bin/ensure-runtime-build.cjs` heals the runtime at command startup.
- Improvement path: Ship or provision verified build artifacts as part of installation, cache the build in CI, and add a bounded startup health check so concurrent invocations do not all incur compilation latency.
- Files: `.github/gsd-core/bin/ensure-runtime-build.cjs`, `.github/gsd-core/bin/lib/`

## Fragile Areas

**GSD runtime/build artifact boundary:**
- Why fragile: `.github/gsd-core/bin/gsd-tools.cjs` depends on compiled modules under `.github/gsd-core/bin/lib/`, while `.github/gsd-core/bin/ensure-runtime-build.cjs` must repair missing output before those imports occur.
- Common failures: Missing TypeScript, missing `tsconfig.build.json`, a failed compilation, stale compiled output, or concurrent builds can prevent every GSD command from loading.
- Safe modification: Preserve the sentinel/lock contract, test fresh-checkout and parallel-start behavior, and validate both the source and compiled runtime paths after changes.
- Test coverage: No repository product test suite or test configuration is present; runtime-specific tests are not detectable from the project root.
- Files: `.github/gsd-core/bin/ensure-runtime-build.cjs`, `.github/gsd-core/bin/gsd-tools.cjs`, `.github/gsd-core/bin/lib/`

**Installer-managed metadata:**
- Why fragile: Framework behavior depends on synchronized generated manifests, installation state, agent definitions, and workflow files.
- Common failures: Partial upgrades, manifest drift, or edits to generated files can make commands disagree about installed capabilities.
- Safe modification: Treat `.github/gsd-file-manifest.json` and `.github/gsd-install-state.json` as generated metadata, update them through the installer workflow, and run the available GSD validation commands after upgrades.
- Test coverage: No project-level CI or automated validation configuration is present.
- Files: `.github/gsd-file-manifest.json`, `.github/gsd-install-state.json`, `.github/gsd-core/bin/`, `.github/workflows/`

## Scaling Limits

**No measurable application capacity:**
- Current capacity: Not applicable; no server, worker, database, or client application exists.
- Limit: Any capacity estimate would be speculative until the product architecture and workload are implemented.
- Symptoms at limit: Not detectable.
- Scaling path: Establish a minimal runnable vertical slice, define workload assumptions, then add load tests and operational limits for each deployed component.
- Files: `AGENTS.md`, `.github/`

## Dependencies at Risk

**Unpinned or undiscoverable product dependencies:**
- Risk: No root `package.json`, lockfile, or equivalent dependency manifest is present, so product dependencies, versions, provenance, and vulnerability status cannot be audited.
- Impact: A future implementation may introduce non-reproducible builds or vulnerable packages without a repository-level update process.
- Migration plan: Add the manifest and lockfile with the chosen runtime, enable automated dependency updates and vulnerability checks, and review transitive dependencies in CI.
- Files: `AGENTS.md`, `.github/`

## Missing Critical Features

**DeployGuard product functionality:**
- Problem: No deployment guard, policy evaluation, provider integration, persistence, user interface, API, or command-line entry point is present.
- Current workaround: None in the repository.
- Blocks: All intended user workflows and meaningful acceptance testing.
- Implementation complexity: Unknown until product requirements and architecture are defined.
- Files: `AGENTS.md`, `.github/`

**Repository delivery controls:**
- Problem: No project CI workflow, release configuration, deployment manifest, or operational documentation is detectable.
- Current workaround: Manual setup would be required outside the repository.
- Blocks: Reproducible validation, security gates, artifact publication, and deployment automation.
- Implementation complexity: Low to medium for baseline CI; deployment complexity depends on the target platform.
- Files: `.github/`, `AGENTS.md`

## Test Coverage Gaps

**Entire product surface:**
- What's not tested: No product unit, integration, end-to-end, regression, or load tests exist because no product source is present.
- Risk: Future implementation can regress without detection, and security or deployment behavior cannot be verified.
- Priority: High
- Difficulty to test: The test harness and product boundaries must be created first.
- Files: `AGENTS.md`, `.github/`

**Runtime tooling validation in this checkout:**
- What's not tested: Fresh-checkout runtime healing, missing-toolchain errors, lock contention, and generated-artifact consistency are not covered by a repository test command.
- Risk: GSD commands may fail only in a clean environment or under parallel invocation.
- Priority: Medium
- Difficulty to test: Requires a controlled temporary checkout plus a locally provisioned TypeScript toolchain.
- Files: `.github/gsd-core/bin/ensure-runtime-build.cjs`, `.github/gsd-core/bin/gsd-tools.cjs`

---

*Concerns audit: 2026-08-22*
*Update as issues are fixed or new ones discovered*