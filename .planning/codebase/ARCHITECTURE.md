<!-- refreshed: 2026-08-22 -->
# Architecture

**Analysis Date:** 2026-08-22

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Repository guidance and workflow             │
│  `AGENTS.md` / `.github/copilot-instructions.md`             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    GSD orchestration scaffold                │
│  `.github/skills/`   `.github/agents/`   `.github/scripts/`  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Planning artifacts                        │
│                  `.planning/codebase/`                        │
└─────────────────────────────────────────────────────────────┘
```

DeployGuard has no application architecture yet. The repository is a sparse planning scaffold; no runtime, UI, API, persistence layer, or domain implementation is present.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Repository guidance | Defines agent and GSD operating rules | `AGENTS.md`, `.github/copilot-instructions.md` |
| Agent definitions | Describes specialized GSD agent roles, including codebase mapping | `.github/agents/gsd-codebase-mapper.agent.md` |
| Workflow skills | Stores command-specific planning and execution instructions | `.github/skills/` |
| GSD scripts | Provides command support, changeset handling, and drift checks | `.github/scripts/` |
| Codebase map | Stores generated architecture and repository analysis | `.planning/codebase/` |

## Pattern Overview

**Overall:** Documentation-driven workflow scaffold; application layering not detected.

**Key Characteristics:**
- GSD commands are described by Markdown skill files under `.github/skills/`.
- Specialized agent roles are declared under `.github/agents/`.
- JavaScript support scripts under `.github/scripts/` are the only executable project-adjacent code detected.
- No imports, services, controllers, components, models, or domain boundaries exist for DeployGuard.

## Layers

**Guidance and orchestration:**
- Purpose: Configure and coordinate GSD-assisted repository work.
- Location: `.github/`, `AGENTS.md`
- Contains: Instructions, agent definitions, skills, hooks, and helper scripts.
- Depends on: VS Code/Copilot execution and Node.js for `.cjs` helpers where invoked.
- Used by: GSD command execution, not by a DeployGuard runtime.

**Planning artifacts:**
- Purpose: Record project state and codebase understanding.
- Location: `.planning/`
- Contains: Current codebase analysis documents under `.planning/codebase/`.
- Depends on: Repository inspection.
- Used by: Future planning and execution workflows.

**Application runtime:**
- Purpose: Not implemented.
- Location: No `src/`, `app/`, `server/`, or equivalent directory detected.
- Contains: Not applicable.
- Depends on: Not applicable.
- Used by: Not applicable.

## Data Flow

### Current Repository Flow

1. Repository instructions are read from `AGENTS.md` and `.github/copilot-instructions.md`.
2. GSD command behavior is selected from `.github/skills/` and agent roles from `.github/agents/`.
3. Helper operations may run through `.github/scripts/`.
4. Analysis output is written to `.planning/codebase/`.

### DeployGuard Runtime Flow

Not detected. There is no entry point, request path, event path, persistence path, or user-facing runtime to trace.

**State Management:**
- No application state store or persistence mechanism exists.
- Planning state is file-based under `.planning/` when present.

## Key Abstractions

**GSD skill/agent contract:**
- Purpose: Encapsulates repeatable planning, mapping, review, and execution workflows.
- Examples: `.github/skills/gsd-map-codebase/SKILL.md`, `.github/agents/gsd-codebase-mapper.agent.md`
- Pattern: Markdown-defined workflow and agent contracts.

## Entry Points

**GSD workflow entry:**
- Location: `.github/skills/gsd-map-codebase/SKILL.md`
- Triggers: Explicit GSD map-codebase command invocation.
- Responsibilities: Defines mapping behavior and expected analysis documents.

**DeployGuard application entry:**
- Location: Not detected.
- Triggers: Not applicable.
- Responsibilities: Not implemented.

## Architectural Constraints

- **Threading:** No DeployGuard runtime exists; GSD execution is external/tool-driven.
- **Global state:** File-based workflow metadata may exist under `.planning/` and `.github/`; no application singleton was detected.
- **Circular imports:** Not applicable; no application module graph exists.
- **Repository sparsity:** Do not infer runtime boundaries from the GSD scaffold. Add product code in a dedicated application tree and document its entry point when introduced.

## Anti-Patterns

### Treating GSD tooling as product code

**What happens:** DeployGuard behavior is placed in `.github/skills/`, `.github/agents/`, or `.github/scripts/`.
**Why it's wrong:** Those paths define repository automation and agent workflows, not the product runtime.
**Do this instead:** Add product implementation under a dedicated `src/` (or framework-native equivalent) and keep workflow support in `.github/`.

### Adding runtime assumptions without an entry point

**What happens:** New modules are added without choosing a runtime, startup command, or dependency boundary.
**Why it's wrong:** There is currently no executable application contract to anchor imports or data flow.
**Do this instead:** Establish the runtime entry point and module layout together, then update this document and `.planning/codebase/STRUCTURE.md`.

## Error Handling

**Strategy:** DeployGuard application error handling is not implemented.

**Patterns:**
- GSD helper scripts contain their own command-level behavior, but no product-wide error contract is defined.
- Future runtime errors should be documented alongside the selected framework and entry point.

## Cross-Cutting Concerns

**Logging:** No DeployGuard logging layer detected.
**Validation:** No DeployGuard validation layer detected.
**Authentication:** No DeployGuard authentication layer detected.

---

*Architecture analysis: 2026-08-22*