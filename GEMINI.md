# GEMINI.md — Project Engineering and Code Quality Rules

These rules apply to every coding task in this repository. Follow them before inspecting, planning, editing, testing, or refactoring code. The feature request or master prompt defines **what** to build; this file defines **how** to build and maintain it.

## 1. Core principles

- Prioritize correctness, clarity, maintainability, reliability, and a good player experience over cleverness or code volume.
- Prefer the simplest design that fully solves the requirement. Do not over-engineer, introduce speculative abstractions, or add dependencies without a concrete benefit.
- Make complete, working changes. Do not substitute stubs, fake implementations, silent feature removals, or `TODO` comments for required functionality.
- Preserve existing working behavior unless the task explicitly requires a change. Keep changes focused and avoid unrelated refactoring.
- If requirements conflict or a genuine blocker prevents completion, explain the conflict or blocker clearly. Do not silently guess away an important requirement.

## 2. Understand the repository before changing it

- Inspect the relevant files, project structure, package scripts, configuration, and existing conventions before editing.
- Reuse existing utilities and patterns when they are sound. Do not create duplicate helpers or parallel systems without a reason.
- Identify the smallest sensible implementation plan, then proceed with the work. Do not stop after presenting a plan when the task asks for implementation.
- Keep changes within the current repository. Do not delete or overwrite unrelated work.
- Do not change dependencies, build tools, or configuration unless needed. When adding a dependency, use a compatible version and be able to explain why it is needed.

## 3. TypeScript standards

- Use TypeScript's type system to make invalid states and incorrect usage harder to express.
- Avoid `any`. Prefer a specific type; use `unknown` at uncertain boundaries and narrow it safely.
- Avoid non-null assertions (`!`), unsafe type assertions, and broad casts unless there is a clear, documented reason.
- Define clear types for important domain concepts, function parameters, return values, and state transitions.
- Prefer discriminated unions or similarly explicit types for finite states, such as game states and player actions.
- Keep functions focused and small enough to understand. Extract a helper when it improves clarity or eliminates meaningful duplication—not merely to reduce line count.
- Use descriptive names. Avoid cryptic abbreviations, boolean parameters with unclear meaning, and functions that perform unrelated tasks.
- Handle nullable values and failures explicitly. Do not suppress compiler or lint errors just to make a check pass.
- Follow the repository's formatting and linting rules. If none exist, use consistent formatting and enable useful TypeScript strictness where practical without creating unnecessary migration work.

## 4. Architecture and separation of responsibilities

- Keep presentation, input, gameplay rules, world generation, collision detection, audio, assets, and persistence appropriately separated.
- Maintain a clear source of truth for important state. Avoid multiple objects independently storing conflicting copies of the same gameplay fact.
- Keep game tuning values in the central configuration module; avoid scattering unexplained magic numbers throughout the code.
- Use explicit, validated state transitions. Do not let menu, paused, or game-over states accidentally continue gameplay simulation.
- Keep modules cohesive and dependencies understandable. Avoid circular dependencies, giant files, global mutable state, and unnecessary singleton patterns.
- Avoid duplicating business/gameplay rules in the UI. UI components should display state and submit actions; the gameplay systems should enforce the rules.
- Comments should explain intent, non-obvious decisions, constraints, and trade-offs. Do not add comments that merely repeat what the code says.

## 5. Game-loop and gameplay correctness

- Use frame-rate-independent time steps for motion, acceleration, jumps, slides, distance, and timers. Handle large elapsed-time gaps safely.
- Keep simulation updates and rendering responsibilities clear. Avoid tying gameplay speed to the monitor's frame rate.
- Handle keyboard input consistently, including key repeat, key release, and inputs received outside the running state.
- Ensure action transitions update animation and collision state together. Reset all relevant state when reusing or restarting an action.
- Keep collision detection deterministic and consistent with the character's actual movement state and collision bounds.
- Ensure procedural spawning respects gameplay constraints. Random generation must not bypass explicit rules or create avoidable unfairness.
- Keep pause/resume, tab visibility changes, restart, and game-over transitions idempotent where applicable: repeating an event must not duplicate its effects.

## 6. Three.js resources and performance

- Reuse shared geometries, materials, textures, and other resources when appropriate.
- Use object pooling for frequently recycled gameplay objects when required by the design. Fully reset pooled objects before reuse, including transforms, visibility, velocities, animation state, collision state, and collection flags.
- Give resources clear ownership. Dispose of geometries, materials, textures, render targets, and other GPU resources when they are no longer used; do not dispose of shared resources while another object still needs them.
- Avoid unnecessary object allocation, scene traversal, asset loading, and expensive calculations in per-frame update code.
- Bound the number of active track sections, obstacles, coins, particles, and other generated objects.
- Prevent duplicate animation loops, event listeners, timers, audio playback, and resize handlers when restarting or reinitializing the game.
- Keep camera, renderer, and HUD resize handling consistent. Do not trade away obstacle visibility or control responsiveness solely for visual effects.
- Optimize based on evidence and likely bottlenecks. Avoid premature complexity or claiming a frame rate that has not been measured.

## 7. Error handling and assets

- Handle expected failure paths explicitly, including unavailable assets, malformed persisted data, failed audio initialization, and unsupported browser features.
- Keep optional asset failures from breaking required gameplay. Provide a functional fallback when the requirements call for one.
- Do not hide important failures with empty catch blocks or misleading success messages. Log actionable diagnostic details without flooding the console each frame.
- Do not depend on external asset URLs at runtime when the project requirements call for locally available assets.
- Use assets only when their licenses permit the intended use, and retain attribution or license information where required.
- Never hard-code secrets, credentials, or private tokens in source files.

## 8. Testing and verification

- Add or update tests whenever behavior changes, particularly for game rules, state transitions, boundaries, collisions, spawning, persistence, pause/resume, and restart behavior.
- Prefer tests of deterministic gameplay logic that do not require rendering a full 3D scene. Use browser-level tests for behavior that genuinely needs a browser.
- Test important edge cases and regressions, not only the happy path.
- Run the relevant tests, type checks, lint checks, and production build available in the repository after making changes.
- If a check fails, investigate and fix the cause where possible, then rerun the relevant check.
- Never claim a test, build, or browser check passed unless it was actually executed and its result observed.
- If a check cannot be run in the available environment, state exactly what could not be verified. Distinguish tested behavior from assumptions.
- Do not weaken or delete a meaningful test just to make the suite pass. If expected behavior changes, update the test and explain why.

## 9. Safe editing and dependency management

- Make the smallest coherent change that satisfies the task; do not rewrite unrelated files for stylistic preference.
- Preserve useful user changes and existing project conventions.
- Do not add packages when a small, clear implementation with existing tools is sufficient.
- Keep package scripts truthful. A test or validation script must perform the stated check rather than print a success message.
- Update documentation and configuration when behavior, commands, dependencies, or architecture changes.
- Never claim that unfinished functionality is complete. List remaining gaps explicitly.

## 10. Documentation and completion report

- Document public or non-obvious APIs, important invariants, setup requirements, and meaningful architectural decisions.
- Keep the README's installation, development, test, and build instructions aligned with the actual repository.
- For a non-trivial task, finish with a concise report containing what changed, the checks actually run and their results, and any remaining limitations.
- Report important dependency or asset decisions and licensing notes where applicable.

## 11. Required workflow for every implementation task

1. Read the applicable project instructions and inspect relevant code before editing.
2. Identify the required behavior and affected modules; make a brief plan for substantial changes.
3. Implement the smallest complete solution that follows these rules.
4. Review the diff for unintended changes, duplicated logic, unsafe types, stale state, cleanup omissions, and unimplemented requirements.
5. Run relevant tests and validation commands; fix problems and rerun checks when practical.
6. Summarize the result honestly, including verification and anything still incomplete.

**Definition of done:** the requested behavior is implemented, integrated with existing code, maintainable, and verified to the extent possible in the available environment. Code generation alone is not completion.
