# Jungle Runner: Ancient Temple Escape

A complete, high-performance 3D endless runner game built with **Three.js**, **TypeScript**, and **Vite**. Inspired by classic endless runners such as *Temple Run* and *Subway Surfers*, featuring an original visual identity, stylized jungle explorer character, dynamic environment zones, obstacle clearing mechanics, sound synthesis, and persistent score records.

---

## 🕹️ Gameplay & Controls

| Control | Action | Details |
|---|---|---|
| **Up Arrow** / <kbd>W</kbd> | **Jump** | Clear low obstacles (logs/hurdles) with a parabolic vertical arc |
| **Down Arrow** / <kbd>S</kbd> | **Slide / Crouch** | Duck beneath overhead stone beams by lowering collision height |
| **Left Arrow** / <kbd>A</kbd> | **Lane Left** | Switch one lane left (from Middle to Left) |
| **Right Arrow** / <kbd>D</kbd> | **Lane Right** | Switch one lane right (from Middle to Right) |
| **Esc** | **Pause / Resume** | Freezes simulation, movement, distance accumulation, and timers |
| **HUD Button ⏸** | **Pause / Resume** | On-screen pause toggle |
| **Sound Button 🔊** | **Mute / Unmute** | Toggle Web Audio sound effects and ambient jungle groove |
| **Fullscreen ⛶** | **Toggle Fullscreen** | Expand view to full display |

### Mandatory Game Rules & Mechanics

- **Lane Boundary Death**: The track features 3 parallel lanes (Left, Middle, Right). Attempting to move Left while in the Left lane or Right while in the Right lane triggers an immediate Game Over ("Fell off the side of the track!").
- **Vertical Action Cancellation**:
  - Up Arrow during an active slide immediately cancels the slide and initiates a jump.
  - Down Arrow during an active jump immediately cancels the jump and drops into a slide.
  - Lane switching remains responsive and fully available while jumping or sliding.
- **Accurate Hitboxes & Obstacle Categories**:
  1. **Low Obstacle (Fallen Jungle Log)**: Must jump over. Colliding while standing or sliding causes Game Over.
  2. **Overhead Obstacle (Stone Temple Lintel / Barrier)**: Must slide beneath. Colliding while standing or jumping causes Game Over.
  3. **Full-Lane Blocker (Ancient Stone Totem / Ruin Wall)**: Occupies the entire lane height and width. Impassable by jumping or sliding; player must switch lanes.
- **Guaranteed Solvability**: Procedural obstacle generation guarantees at least one survivable route at every step across all speeds. Never generates 3 full-lane blockers side-by-side.
- **Golden Coins**: Placed along lanes, jumping arcs over low hurdles, and slide lines under overhead beams. Collected coins increment the score immediately.
- **Progressive Difficulty**: Running speed smoothly accelerates from initial speed ($14\,\text{m/s}$) up to capped maximum speed ($28\,\text{m/s}$).
- **Environment Transitions**: Smoothly transitions between 3 distinct visual zones every 300 meters:
  1. *Lush Jungle* (palm trees, vines, vibrant vegetation, warm sunlight, green fog)
  2. *Ancient Temple Ruins* (carved stone pillars, broken arches, warm amber sunbeams)
  3. *Moss-Covered Stone Passages* (massive stone walls, overgrown masonry, glowing torchlight)
- **Automatic Pause**: Automatically freezes gameplay simulation when switching tabs (`document.visibilitychange`). Returning requires manual resume to prevent accidental deaths.
- **Best Distance Persistence**: High score persists in `localStorage` across page refreshes with safe fallback handling for incognito or restricted environments.

---

## 🛠️ Architecture & Separation of Responsibilities

```
jungle-runner/
├── src/
│   ├── config.ts            # Central game tuning values, speeds, dimensions, and timings
│   ├── types.ts             # Domain types (GameState, Lane, Action, Obstacles, Bounds)
│   ├── main.ts              # Entry point and WebGL initialization error handling
│   ├── style.css            # Atmospheric jungle UI, HUD, and modal panels styling
│   ├── audio/
│   │   └── sound-manager.ts # Synthesized Web Audio API SFX & ambient rhythmic percussion
│   ├── game/
│   │   ├── collision.ts     # Deterministic 3D AABB collision detection
│   │   ├── player.ts        # Player controller, procedural 3D explorer mesh & animations
│   │   ├── obstacles.ts     # 3D obstacle models and object pool (Low, Overhead, FullBlock)
│   │   ├── coins.ts         # Rotating 3D golden coins and object pool
│   │   ├── track.ts         # 3-lane endless track manager and zone scenery recycling
│   │   ├── spawner.ts       # Solvable procedural world spawner with speed progression
│   │   └── game.ts          # Central game loop, Three.js scene, camera, input, and lifecycle
│   ├── ui/
│   │   └── hud.ts           # Loading, Menu, HUD, Pause, Game Over, and Error screens
│   └── utils/
│       └── storage.ts       # Error-safe localStorage wrapper for best distance record
├── tests/
│   ├── config.test.ts       # Central config, zone math, and boundary constraint tests
│   ├── player.test.ts       # Lane changes, boundary death, jump/slide cancellation tests
│   ├── collision.test.ts    # Obstacle clearance and coin collection tests
│   ├── spawner.test.ts      # Solvability guarantee and pattern generation tests
│   ├── storage.test.ts      # LocalStorage reading, updating, and error fallback tests
│   ├── game-state.test.ts   # UI screen activations and score display tests
│   └── browser/
│       └── runner.mjs       # Playwright end-to-end headless browser verification test
├── index.html               # Web application shell
├── package.json             # Scripts and dependencies
├── tsconfig.json            # Strict TypeScript configuration
├── vite.config.ts           # Vite bundler config
└── vitest.config.ts         # Vitest test runner configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+)

### Installation

```bash
# Clone the repository and navigate into the folder
cd jungle-runner

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

### Automated Unit and Integration Tests

Run the full Vitest automated test suite:

```bash
npm test
```

### End-to-End Browser Verification Test

Run the automated Playwright browser test verifying the complete game flow:

```bash
npm run test:browser
```

### Production Build

Create an optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📦 Asset & Audio Strategy

- **100% Self-Contained Assets**: 3D character explorer model, hats, limbs, track paving, jungle trees, temple pillars, torches, and obstacles are generated procedurally with Three.js geometries and shaders. No external runtime CDN or asset download dependencies.
- **Web Audio API**: Crisp retro-arcade sound effects (jump whoosh, slide dash, lane switch, coin chime, crash impact) and ambient rhythmic jungle percussion are synthesized directly in the browser. Respects browser autoplay policies and unlocks upon user interaction.
- **Zero Third-Party Image/Sound Licensing Friction**: Free from copyright encumbrance or network CORS issues.

---

## 📜 License

MIT License.
