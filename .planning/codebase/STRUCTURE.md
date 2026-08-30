# Codebase Structure

**Analysis Date:** 2026-08-22

## Directory Layout

```text
DeployGuard/
├── AGENTS.md                         # Repository-level GSD guidance
├── .github/
│   ├── agents/                       # Specialized GSD agent definitions
│   ├── hooks/                        # GSD session hook configuration
│   ├── scripts/                      # GSD JavaScript helper scripts
│   ├── skills/                       # Command-specific GSD instructions
│   └── copilot-instructions.md       # GSD operating instructions
└── .planning/
    └── codebase/                     # Generated repository analysis
```

No product source tree, test tree, package manifest, or framework configuration is present.

## Directory Purposes

**`.github/agents/`:**
- Purpose: Defines specialized GSD agent roles.
- Contains: `.agent.md` instruction files such as `.github/agents/gsd-codebase-mapper.agent.md`.
- Key files: `.github/agents/gsd-codebase-mapper.agent.md`.

**`.github/skills/`:**
- Purpose: Defines GSD command workflows and domain-specific operating instructions.
- Contains: One `SKILL.md` per command capability, including `.github/skills/gsd-map-codebase/SKILL.md`.
- Key files: `.github/skills/gsd-map-codebase/SKILL.md`.

**`.github/scripts/`:**
- Purpose: Supports GSD command execution and repository checks.
- Contains: CommonJS helpers, changeset utilities, and script libraries.
- Key files: `.github/scripts/fix-slash-commands.cjs`, `.github/scripts/lib/`.

**`.planning/codebase/`:**
- Purpose: Stores generated codebase intelligence for future planning.
- Contains: Architecture, structure, and other focus-area analysis documents.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `.github/skills/gsd-map-codebase/SKILL.md`: GSD mapping workflow contract.
- DeployGuard runtime entry point: Not detected.

**Configuration:**
- `AGENTS.md`: Repository-level guidance.
- `.github/copilot-instructions.md`: GSD-specific instruction layer.
- No package, compiler, framework, or deployment configuration detected.

**Core Logic:**
- GSD support logic: `.github/scripts/`.
- DeployGuard domain logic: Not implemented.

**Testing:**
- No test directory, test files, or test runner configuration detected.

## Naming Conventions

**Files:**
- GSD command documents use uppercase `SKILL.md` within lowercase command directories, for example `.github/skills/gsd-map-codebase/SKILL.md`.
- Agent definitions use lowercase kebab-case names with the `.agent.md` suffix, for example `.github/agents/gsd-codebase-mapper.agent.md`.
- Codebase analysis documents use uppercase names, for example `.planning/codebase/ARCHITECTURE.md`.
- Product naming conventions are not established; choose conventions with the first runtime implementation and apply them consistently.

**Directories:**
- Tooling directories use lowercase names such as `.github/agents/`, `.github/scripts/`, and `.github/skills/`.
- Planning output is grouped under `.planning/codebase/`.

## Where to Add New Code

**New Feature:**
- Primary code: Create a dedicated product source tree, conventionally `src/`, after selecting the runtime.
- Tests: Create a corresponding `tests/` tree or co-located test files according to the selected framework; no existing pattern constrains the choice.

**New Component/Module:**
- Implementation: Place it under the selected `src/` module boundary, not under `.github/`.
- Establish an explicit application entry point such as `src/index.*`, `src/main.*`, or the framework-native equivalent at the same time.

**Utilities:**
- Shared helpers: Use a dedicated product utility directory such as `src/lib/` or `src/utils/` once the runtime is selected.
- GSD-only helpers belong in `.github/scripts/lib/` and should remain separate from DeployGuard behavior.

## Special Directories

**`.github/`:**
- Purpose: Repository automation and GSD configuration.
- Generated: Partly managed by GSD installation and scripts.
- Committed: Present in the working tree; Git tracking should be verified before release.

**`.planning/`:**
- Purpose: Planning and codebase intelligence artifacts.
- Generated: Yes, by GSD workflows and mapper agents.
- Committed: No repository tracking is currently detected for the sparse working tree.

**`.git/`:**
- Purpose: Git repository metadata.
- Generated: Yes, by Git.
- Committed: Not applicable.

---

*Structure analysis: 2026-08-22*