# Fjord Simulator

A WebGL flight simulator set in the Norwegian fjords, built with [Three.js](https://threejs.org/).
Choose between an **F-22 Raptor** or a **JAS 39 Gripen**, fly through 25 rings, and survive 2 minutes.

---

## Running Locally

Because the game uses ES modules (`import`/`export`) and fetches Three.js from a CDN, it must be
served over HTTP — opening `index.html` directly as a `file://` URL will not work.

### Quickest way (no install needed)

```bash
npx serve .
# then open http://localhost:3000
```

### Or with Python

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Controls

| Key | Action |
|---|---|
| `W` / `↑` | Pitch nose down |
| `S` / `↓` | Pitch nose up |
| `A` / `←` | Roll left |
| `D` / `→` | Roll right |
| `Q` | Yaw left |
| `E` | Yaw right |
| `Shift` | Increase throttle |
| `Ctrl` | Decrease throttle |
| `Space` | Afterburner |
| `G` | Fire missile (8 per game, 2 s cooldown) |

---

## Planes

| | F-22 Raptor | JAS 39 Gripen |
|---|---|---|
| Origin | USA | Sweden |
| Engines | Twin | Single |
| Top speed | Higher | Slightly lower |
| Agility | Standard | More agile |
| Signature features | Twin angled tails | Canard surfaces |

---

## Project Structure

```
FlightSimulator_02/
├── index.html              # Entry point — HTML shell only
├── package.json            # npm scripts (start/dev)
├── README.md
│
├── css/
│   └── styles.css          # All CSS (HUD, screens, plane cards)
│
└── js/
    ├── main.js             # init(), animate(), event wiring
    ├── state.js            # Shared mutable game state object
    ├── constants.js        # All game constants
    ├── environment.js      # Sky shader + animated water shader
    ├── terrain.js          # Height function, chunk streaming, trees
    ├── flight.js           # Flight physics + collision detection
    ├── hud.js              # HUD updates + minimap canvas drawing
    ├── rings.js            # Ring generation + collect animation
    ├── missiles.js         # Missile fire, update, cleanup
    └── planes/
        ├── f22.js          # F-22 Raptor — Three.js geometry
        └── gripen.js       # JAS 39 Gripen — Three.js geometry
```

### Adding a New Plane

1. Create `js/planes/yourplane.js` — export a `createYourPlane()` function that returns a `THREE.Group`.
   - Set `group.userData.glows = [...]` with the engine glow meshes so the animate loop can animate them.
   - Scale the group to `1.5` like the existing planes.
2. Import it in `js/game.js` and add a branch in `startGame()`.
3. Add a card in the `#plane-select-row` section of `index.html`.

### Scoring

| Event | Points |
|---|---|
| Ring collected | +100 |
| Surviving | +5 / second |
| Mission complete (all time) | +500 bonus |

---

## Tech Stack

- **Three.js r128** — loaded via CDN import map (no build step required)
- Plain ES modules — no bundler, no framework, no npm install needed to play
- Procedural geometry only — no external 3D model files
- Custom GLSL shaders for sky gradient and animated water
