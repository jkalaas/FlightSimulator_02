// ============================================================
//  FJORD SIMULATOR — Shared Mutable State
//  All game modules import from this file to read/write state.
// ============================================================

export const state = {
    // Three.js core
    scene:        null,
    camera:       null,
    renderer:     null,
    clock:        null,
    sunLight:     null,
    waterMesh:    null,

    // Game state
    gameTime:     0,
    gameRunning:  false,
    animating:    false,
    score:        0,

    // Plane
    planeGroup:   null,   // holds the active THREE.Group (F-22 or Gripen)
    selectedPlane: null,  // 'f22' | 'gripen'
    speed:        0,
    throttle:     0.5,
    afterburner:  false,

    // Input
    keys:         {},

    // World objects
    terrainChunks: [],
    rings:         [],
    ringsPassed:   0,

    // Missiles
    missiles:       [],
    missileCount:   8,
    missileCooldown: 0,

    // UI
    minimapCtx:     null,
    warningOverlay: null,
};
