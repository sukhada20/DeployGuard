# Technology Stack

**Analysis Date:** 2026-08-22

## Repository Status

The repository is sparse and contains no application implementation. The root currently exposes `AGENTS.md` and `.github/`; no `src/`, `app/`, `lib/`, or equivalent application directory is detected.

## Languages

**Primary:**
- Not detected - no application source files or language manifests are present.

**Secondary:**
- Markdown - repository guidance and workflow documentation in `AGENTS.md` and `.github/`.
- JSON - GSD installation metadata in `.github/gsd-install-state.json` and `.github/gsd-file-manifest.json`.

## Runtime

**Environment:**
- Not detected for an application runtime.
- `.github/gsd-core/` and `.github/scripts/` indicate repository tooling is installed, but no project runtime configuration is present.

**Package Manager:**
- Not detected.
- Lockfile: missing/not detected.

## Frameworks

**Core:**
- Not detected - no application framework or dependency manifest is present.

**Testing:**
- Not detected - no test runner configuration or test files are present.

**Build/Dev:**
- GSD workflow tooling is present under `.github/gsd-core/` and `.github/skills/`.
- No application build or development tool configuration is present.

## Key Dependencies

**Critical:**
- Not detected - no `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or equivalent manifest is present.

**Infrastructure:**
- Not detected.

## Configuration

**Environment:**
- No application environment configuration is detected.
- No safe-to-report environment variable contract is present.
- `.github/copilot-instructions.md` contains repository agent workflow instructions.

**Build:**
- No application build configuration is detected.
- GSD metadata is stored in `.github/gsd-install-state.json` and `.github/gsd-file-manifest.json`.

## Platform Requirements

**Development:**
- No project-specific requirements are documented. Repository automation appears to rely on the host tooling used by the GSD assets, but its runtime version is not specified in the repository.

**Production:**
- Not applicable/not detected; no deployable application or deployment target is present.

---

*Stack analysis: 2026-08-22*
