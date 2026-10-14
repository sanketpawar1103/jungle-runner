# Master Prompt: Build a Complete 3D Jungle Endless Runner Game

## 1. Your role and objective

Act as a senior game developer and software engineer. Build a complete, playable, browser-based 3D endless runner game inspired by the general gameplay conventions of games such as Temple Run and Subway Surfers.

The game must have its own original visual identity, environment, and character. Do not copy protected characters, branding, or distinctive level designs from existing games.

Your goal is to implement the complete game directly in the current repository, test it, fix issues, and leave it in a runnable state.

**Do not stop after producing a plan, creating a basic prototype, or displaying a static 3D scene.** Continue implementing all required features until the acceptance criteria have been addressed.

Work autonomously on routine technical decisions. Choose sensible defaults, use appropriate fallbacks, resolve implementation issues, and continue through all milestones without asking for approval for routine tasks. Do not silently omit required features.

## 2. Technology stack

Use the following technology stack:

- Three.js for 3D rendering.
- TypeScript for application and gameplay logic.
- Vite for development and production builds.
- HTML and CSS for the interface, menus, overlays, and HUD.
- Appropriate testing tools for automated game-logic tests.

Choose compatible, stable dependencies appropriate for the project.

You may select additional libraries when they materially improve the implementation, but avoid unnecessary dependencies and overengineering.

The target platform is a modern desktop web browser. Keyboard controls are the primary input method.

## 3. Game concept and visual identity

Create an original, stylized 3D jungle adventure.

The environment should contain elements such as:

- Lush tropical vegetation and trees.
- Rocks, vines, and natural scenery.
- Ancient stone ruins and temple structures.
- Moss-covered stone passages and weathered architecture.
- Golden collectible coins.
- Original obstacles that fit the environment.

Use polished, colorful, slightly cartoon-like 3D graphics. The game should feel like a cohesive adventure rather than a collection of unrelated objects.

The environment should gradually transition between distinct but coherent visual zones:

1. Lush jungle.
2. Ancient temple ruins.
3. Moss-covered stone passages.

Transitions between these zones should be smooth. Change the scenery, lighting, vegetation, and decorative details without changing the fundamental gameplay.

**The track must always have three parallel lanes. There must be no branching paths, left turns, right turns, or perpendicular track sections.** Left and right arrow inputs are exclusively for switching lanes.

Keep the environment visually appealing, but prioritize visibility of upcoming obstacles, responsiveness, and performance.

## 4. Character and camera

Create an original jungle-explorer character with an appearance that fits the environment.

Prefer a suitable, properly licensed animated 3D character model where practical. If an appropriate model cannot be obtained or loaded, create a simple stylized procedural character with functional animations.

The character should support:

- Continuous running.
- Jumping.
- Sliding or crouching.
- Smooth lane switching.
- Landing.
- Death or game-over reaction.

Use smooth transitions between animations. The character must not freeze, disappear, or become stuck in an animation after an action ends.

Use a third-person camera positioned behind the character.

The camera should:

- Maintain a clear view of all three lanes.
- Show enough track ahead for the player to recognize obstacles and react.
- Respond smoothly to lane changes.
- Provide subtle feedback during jumps and landings.
- Avoid distracting shaking or sudden camera movements.
- Preserve the visibility of the track during all movements.

Keep the player near a consistent forward position while the track, obstacles, coins, and scenery move toward the player.

## 5. Core gameplay and track generation

Implement a true endless-runner experience.

The track must never reach a final endpoint during normal gameplay. Generate or recycle track sections ahead of the player and reuse sections after they pass behind the camera.

Use three fixed lanes:

- Left lane.
- Middle lane.
- Right lane.

Represent the player's lane explicitly in gameplay logic. Lane changes must move the character to the adjacent lane with a smooth visual transition.

Do not allow the character to switch directly across multiple lanes with a single key press.

The world-moving-toward-the-player approach must remain consistent across track movement, obstacle movement, coin movement, and scenery animation.

Generate obstacles and coins ahead of the player. Remove, recycle, or pool objects after they are no longer needed.

The initial track section should provide enough time for the player to understand the controls and begin playing comfortably.

## 6. Keyboard controls

Implement these controls:

| Key | Action |
|---|---|
| Up arrow | Jump |
| Down arrow | Slide or crouch |
| Left arrow | Switch one lane to the left |
| Right arrow | Switch one lane to the right |
| Esc | Pause or resume according to the current gameplay state |
| On-screen pause button | Pause or resume gameplay |

Show the controls clearly on the start screen.

### Lane boundaries

Lane-boundary behavior is a mandatory gameplay rule.

- If the player is in the leftmost lane and presses Left, trigger immediate game over.
- If the player is in the rightmost lane and presses Right, trigger immediate game over.
- Do not clamp the player to the current lane.
- Do not silently ignore an invalid outer-lane input.
- The game-over transition must occur only once.

For valid lane changes, move one lane left or right.

### Input handling

Each deliberate key press must trigger one action.

Holding a key must not repeatedly trigger jumps or move the character across multiple lanes. Handle keyboard events and key-repeat behavior appropriately.

Gameplay inputs must work only while the game is in the `RUNNING` state. Inputs received on the loading screen, start screen, paused state, or game-over screen must not cause gameplay movement.

Lane switching must remain available while the player is jumping or sliding.

### Jumping and sliding

Jumping and sliding should have configurable durations and clear animation states.

Jumping should genuinely allow the player to clear low obstacles. Sliding should genuinely allow the player to pass beneath overhead obstacles.

A jump and slide must never be active simultaneously.

If the player presses the opposite vertical-action key during an action, immediately cancel the current jump or slide and begin the new action. For example:

- Up during a slide cancels the slide and starts a jump.
- Down during a jump cancels the jump and starts a slide.

The new action should transition cleanly and update the collision state correctly. Do not allow conflicting animations or stale collision states.

The game must continue processing valid lane-switch inputs while a jump or slide is active.

## 7. Obstacles and collision rules

Implement exactly these three obstacle categories in the initial version. Repeated instances and varied arrangements are expected, but do not add moving obstacles or additional obstacle categories yet.

### Type 1: Low obstacle

A low hurdle or similar obstacle occupying a lane.

The player must jump over it. Running into it without sufficient clearance causes game over.

### Type 2: Overhead obstacle

An obstacle that extends above the running surface and leaves space beneath it.

The player must slide beneath it. Failing to slide correctly causes game over.

### Type 3: Full-lane blocker

A solid blocker occupying a lane.

The player must switch to another available lane. Jumping or sliding must not allow the player to pass through it.

### Collision detection

Implement accurate, consistent collision detection that considers the character's current state and position.

- Jumping must actually clear low obstacles when the character has sufficient vertical clearance.
- Sliding must reduce the character's effective collision height enough to clear overhead barriers.
- Full-lane blockers must remain impassable.
- Contact with a coin must collect it exactly once.
- Collision calculations must not rely only on rough visual overlap when the actual collision volumes do not intersect.

The character must die when a collision rule is violated. Do not introduce a health bar, multiple lives, or a revive system in the initial version.

### Obstacle frequency

Use a moderate, balanced obstacle frequency.

Obstacles should be less frequent at the beginning and gradually become more challenging as the speed increases. Do not overwhelm the player with excessive obstacle density.

The generator must always preserve a feasible route. Never generate an obstacle combination that makes survival impossible through the permitted lane-switching, jumping, and sliding mechanics.

Maintain this condition even when the game reaches maximum speed.

## 8. Coins and distance tracking

Implement collectible golden coins.

Coins should appear in a mixture of:

- Individual coins scattered across different lanes.
- Short lines or patterns that encourage lane changes, jumps, or slides.

Coins may be positioned at ground level or elevated positions where the player can reasonably collect them.

When the player collects a coin:

1. Register the collection exactly once.
2. Remove or deactivate the coin.
3. Increment the current run's coin counter by one.
4. Update the HUD immediately.

Display a visible live coin counter throughout gameplay.

Also calculate and display distance travelled during the current run. Use a consistent unit, such as meters.

Distance must increase only while gameplay is running. It must not increase while the game is loading, on the start screen, paused, or in the game-over state.

Both current-run distance and coin count must reset to zero when a new run starts.

Do not implement power-ups, coin multipliers, or additional coin types in the initial version.

## 9. Speed and difficulty progression

Implement one progressive game mode.

The player should begin at a comfortable running speed. Increase the speed gradually and smoothly throughout the run until a configurable maximum speed is reached.

Once maximum speed is reached, maintain it rather than continuing to accelerate indefinitely.

Keep all relevant gameplay values in a central configuration module, including:

- Initial running speed.
- Maximum running speed.
- Acceleration rate.
- Jump duration and height.
- Slide duration.
- Lane-switch transition duration.
- Track-section length.
- Obstacle spawn frequency and spacing.
- Minimum obstacle reaction time.
- Coin spawn parameters.
- Any additional tuning values required by the implementation.

Choose sensible starting values yourself. Test and tune them based on actual gameplay rather than guessing without verification.

Obstacle frequency and challenge may increase gradually with speed, but preserve adequate reaction time and obstacle visibility.

The game should feel progressively harder without sudden speed jumps, impossible sequences, or unfair collisions.

## 10. Game states and user interface

Use explicit, well-defined game states, including:

- `LOADING`
- `MENU`
- `RUNNING`
- `PAUSED`
- `GAME_OVER`
- `ERROR`, if required for initialization failures

Ensure state transitions are valid and prevent multiple simultaneous game-over transitions.

### Loading screen

Show a jungle-themed loading screen with the game title and a loading indicator.

Show measurable loading progress when the implementation can determine it. Otherwise, display a suitable animated indicator rather than inventing a percentage.

Keep Start Game disabled until the essential scene and gameplay systems are ready.

Optional asset failures must not prevent startup if suitable fallbacks exist.

If essential initialization fails completely, display a useful error message and a retry option. Log actionable technical errors in the browser console instead of leaving a blank screen.

### Start screen

Show:

- Original game title and branding.
- A prominent Start Game button.
- Keyboard controls.
- The player's best recorded distance.
- A fullscreen control where practical.

The player must explicitly click Start Game before the character begins running.

Do not start gameplay automatically when the page loads.

### Gameplay HUD

Display:

- Current coin count.
- Current distance.
- Pause control.
- Mute/unmute control.

Keep the HUD readable and ensure it does not obscure the track or upcoming obstacles.

### Pause screen

Provide both an on-screen pause button and keyboard-based pause control.

When paused, freeze the complete gameplay simulation, including:

- Player movement.
- Track movement.
- Obstacle movement.
- Coin movement.
- Running speed and difficulty progression.
- Distance accumulation.
- Gameplay animations and relevant timers.

Resume from the same state without losing collected coins, distance, or the current speed.

Pause and resume must not create additional animation loops, duplicate listeners, or duplicate audio playback.

### Automatic pause for hidden tabs

When the browser tab becomes hidden or loses visibility during gameplay, automatically pause the game.

When the player returns to the tab, keep the game paused and require the player to resume manually.

Do not automatically restart gameplay or allow a large elapsed-time jump to move the character into an obstacle.

The game must not accumulate distance or advance obstacles while it is paused or hidden.

### Game-over screen

When the player hits an obstacle or attempts to move beyond an outer lane:

1. Trigger game over once.
2. Stop gameplay progression immediately.
3. Preserve the final coin count and distance.
4. Display the final distance and collected coins.
5. Update the best-distance record if the run beats it.
6. Provide Play Again and Main Menu buttons.

Play Again must immediately begin a completely fresh run with distance and coin count reset to zero.

The new run must not inherit old obstacles, coins, action states, or timers. It must not create duplicate listeners or animation loops.

Main Menu should return to the start screen without reloading the whole application unnecessarily.

## 11. Best-distance persistence

Persist the best distance using browser `localStorage`.

- Display the best distance on the start screen.
- Update it when a run exceeds the stored record.
- Preserve it across page refreshes and subsequent browser sessions.
- Handle unavailable or invalid stored data safely.
- Keep current-run distance and coins separate from the persistent best-distance record.

No user account, backend server, or cloud save system is required.

## 12. Visual quality, responsiveness, and fullscreen

Build a polished game interface that complements the 3D jungle environment.

Use an adaptive browser layout. The game must respond correctly when the browser window is resized.

On resize:

- Update the renderer dimensions.
- Update the camera aspect ratio and projection matrix.
- Preserve the character and track proportions.
- Reposition and resize the HUD appropriately.
- Avoid stretched graphics or clipped controls.

Provide an optional fullscreen toggle while supporting normal browser-window play.

Handle fullscreen requests and browser restrictions gracefully. Do not require fullscreen mode before the game can start.

Prioritize clear obstacle visibility, readable text, responsive controls, and visual consistency.

## 13. Asset strategy

Use a hybrid approach combining appropriate imported assets and procedural fallbacks.

Use suitable imported models, textures, animations, and other assets where practical. Create simpler objects procedurally when they are sufficient or when appropriate assets are unavailable.

Asset requirements:

- Prefer appropriately licensed assets.
- Document asset sources and licenses where applicable.
- Keep required asset files inside the project.
- Avoid runtime dependence on externally hosted asset URLs.
- Handle missing or failed optional assets gracefully.
- Provide useful fallbacks for the character, scenery, obstacles, coins, and other resources where feasible.
- Ensure optional asset-loading failures do not break gameplay.
- Avoid unnecessary heavyweight assets that compromise performance.

Choose the most practical asset-loading and resource-management approach for the available environment.

## 14. Audio

Support background music and sound effects, including suitable feedback for coin collection and gameplay actions.

Provide one visible mute/unmute button.

You may choose the audio implementation, audio dependencies, licensed audio resources, and any appropriate fallback strategy. Prefer a solution that integrates reliably with the project rather than adding dependencies without clear benefit.

Respect browser audio restrictions. Do not attempt to autoplay audio before an appropriate user interaction. Start audio in accordance with browser policies after the player begins interacting with the game.

Audio failure must not prevent gameplay. Handle unavailable files, failed audio initialization, and mute/unmute state consistently.

Do not silently claim that music or sound effects are functional if they have not been implemented or verified.

## 15. Project architecture

Use a modular, practical TypeScript architecture. Keep related responsibilities separate without creating unnecessary abstractions.

Suggested areas of responsibility include:

- Core game initialization and lifecycle.
- Game loop and timing.
- Player state, animation, and movement.
- Track generation and environment.
- Obstacle spawning and collision detection.
- Coin spawning and collection.
- Difficulty progression and configuration.
- Keyboard input.
- HUD and menus.
- Audio.
- Asset loading and fallbacks.
- Persistent records.

You may choose the exact file and directory structure based on the repository, as long as responsibilities remain clear and the project is maintainable.

Keep gameplay tuning values in a central configuration module rather than scattering magic numbers across the codebase.

Use clear TypeScript types, sensible naming, small focused functions, and appropriate error handling.

Avoid unnecessarily complex design patterns or frameworks. Do not place the complete game implementation in one giant file.

Make sure ownership and cleanup of listeners, timers, animations, object pools, materials, textures, geometries, and audio resources are explicit.

## 16. Performance and long-run stability

Use a frame-rate-independent simulation. Movement, acceleration, distance tracking, jumps, slides, and other time-dependent behavior must not assume a fixed frame rate.

Aim for a best-effort 60 FPS on typical modern computers without claiming it is guaranteed on all hardware.

Required safeguards:

- Use object pooling to recycle track sections, coins, and obstacles.
- Set sensible limits on active objects.
- Reuse geometries, materials, and shared resources where practical.
- Recycle old track sections and scenery safely.
- Prevent unbounded growth in active coins, obstacles, and track sections.
- Remove event listeners and timers when their owners are disposed.
- Prevent duplicate animation loops, event listeners, timers, audio playback, and resize handlers when restarting or reinitializing the game.
- Dispose of GPU resources appropriately when they are genuinely no longer needed.
- Avoid unnecessary allocations and expensive operations inside the render loop.
- Prevent memory leaks during long runs and repeated restarts.
- Avoid huge simulation time steps after tab inactivity or browser interruptions.
- Keep paused simulations fully frozen.

Ensure object pooling does not cause reused objects to retain stale positions, velocities, animation states, collision states, or collection flags.

## 17. Testing and acceptance criteria

Add meaningful automated tests for important gameplay logic. Choose a suitable testing framework for the TypeScript project.

Test at least the following areas:

### Game startup

- The project initializes correctly.
- The loading screen is shown when required.
- The start screen appears when essential systems are ready.
- Gameplay starts only after an explicit Start Game action.

### Player controls

- Each arrow key triggers its documented action.
- Valid lane changes move exactly one lane.
- Invalid outer-lane inputs trigger game over.
- Holding a key does not trigger unintended repeated actions.
- Lane switching works during jumping and sliding.
- Conflicting jump and slide actions obey the cancellation rules.
- Controls are ignored outside the running state.

### Obstacles and collisions

- Low obstacles can be cleared by a valid jump.
- Overhead obstacles can be cleared by a valid slide.
- Full-lane blockers cannot be passed through.
- Collision outcomes match the character's movement and hitbox state.
- Game over triggers exactly once per run.
- Obstacle generation preserves a survivable route.

### Coins and distance

- A coin is collected exactly once.
- The counter increments when a coin is collected.
- Coin collection does not double-count pooled or reused coins.
- Distance increases during active gameplay only.
- Distance and current-run coins reset on a new run.
- Persistent best distance is read, updated, and stored correctly.

### Difficulty

- Speed increases smoothly.
- Maximum speed is enforced.
- Speed does not increase while paused.
- The obstacle generator does not generate unavoidable patterns.

### Pause and restart

- Pause freezes all gameplay progression.
- Resume continues from the same state.
- Switching to a hidden browser tab automatically pauses gameplay.
- Returning to a visible tab does not automatically resume.
- Play Again starts a clean run.
- Repeated restarts do not create duplicate animation loops, listeners, or timers.

### Assets and audio

- The game handles missing optional assets without crashing.
- Audio controls behave correctly.
- Browser audio restrictions are respected.
- Required gameplay remains functional when optional resources are unavailable.

### Build and browser verification

- The production build succeeds.
- Automated tests pass.
- The complete game flow is checked in an actual browser using available testing tools.
- README instructions are consistent with the real project and work on a clean setup.

Do not fabricate test results. Never claim that a build, test, or browser check passed unless you actually performed it and observed the result.

If a particular browser check cannot be executed in the available environment, clearly identify that limitation and distinguish it from the tests that were executed.

## 18. Implementation workflow

Implement the game through the following milestones. Verify each milestone, fix problems, and continue automatically until the full specification has been addressed.

### Milestone 1: Core playable foundation

Build the Three.js scene, renderer, lighting, camera, three-lane track, basic player, keyboard input, and initial running movement.

Verify that the game runs in the browser and the track moves continuously toward the player.

### Milestone 2: Player mechanics and collisions

Implement lane switching, jumping, sliding, animation state transitions, lane-boundary death, the three obstacle types, and collision detection.

Test all movement and collision rules.

### Milestone 3: Endless generation, coins, and progression

Implement recyclable track sections, obstacle spawning, coin spawning and collection, counters, distance tracking, gradual speed progression, maximum speed, and survivable obstacle generation.

Test prolonged gameplay and progression behavior.

### Milestone 4: Complete game experience

Implement the animated character and environment, transitions between jungle zones, loading screen, start screen, HUD, pause/resume, game over, restart, main menu, persistent best distance, audio, and fullscreen support.

Ensure the user interface and 3D scene work together correctly.

### Milestone 5: Quality, performance, and final verification

Implement remaining resource-management safeguards, automated tests, error handling, responsive resizing, browser-tab auto-pause, and documentation.

Run the production build, execute the available tests, and verify the complete gameplay flow in a browser where possible.

Fix identified issues and repeat the relevant checks.

**Do not stop after any individual milestone.** Continue until every requirement has been implemented or a genuine technical blocker prevents completion.

## 19. Repository and development instructions

Assume you are already running in the intended dedicated game repository.

Inspect the existing repository and understand its current state before modifying files. Work in the repository root.

Do not create another nested application directory. Do not manage or recreate the repository itself, modify files outside the repository unnecessarily, or delete unrelated existing work.

Set up or update the project files, dependencies, configuration, tests, `.gitignore`, and README as needed.

Ensure the project can be installed and run using documented commands, typically including:

- Dependency installation.
- Starting the development server.
- Running automated tests.
- Creating a production build.

Choose the appropriate package manager based on the existing repository. Use consistent dependency and lockfile management.

Do not leave placeholder scripts that pretend to run tests or build the game. Do not leave major mechanics as TODO comments or nonfunctional mockups.

If a dependency or asset cannot be obtained, choose a sensible fallback, preserve the required gameplay, and report any genuine limitation.

## 20. Final delivery report

After implementing and verifying the game, provide a concise report containing:

1. The gameplay features implemented.
2. The final project structure and important architectural decisions.
3. Installation and run commands.
4. The automated tests executed and their actual results.
5. The production build result.
6. The browser checks performed and their actual results.
7. Any known limitations or incomplete features.
8. Any significant dependency or asset decisions, including relevant licensing information.

Clearly distinguish completed and verified features from completed but unverified features and anything still incomplete.

Do not claim success based solely on code generation or a successful build.

## Final instruction

Build a complete, polished, original 3D jungle endless runner that satisfies this specification.

Use autonomous, milestone-based implementation. Make reasonable technical decisions, preserve the agreed requirements, fix problems instead of hiding them, and keep working until the acceptance criteria have been addressed.

**The final deliverable must be a runnable game, not merely a plan, a design document, or a visual prototype.**
