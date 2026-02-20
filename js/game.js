// ============================================================
//  FJORD SIMULATOR — Game Lifecycle (start / end / reset)
// ============================================================

import { state } from './state.js';
import { GAME_DURATION, NUM_RINGS, RING_SCORE } from './constants.js';
import { createF22 } from './planes/f22.js';
import { createGripen } from './planes/gripen.js';
import { updateTerrain } from './terrain.js';
import { generateRings } from './rings.js';
import { resetMissiles, clearMissiles } from './missiles.js';
import { fjordMeander } from './terrain.js';

export function clearWorld() {
    state.terrainChunks.forEach(c => {
        state.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        c.trees.forEach(t => state.scene.remove(t));
    });
    state.terrainChunks = [];

    state.rings.forEach(r => state.scene.remove(r));
    state.rings = [];

    if (state.planeGroup) {
        state.scene.remove(state.planeGroup);
        state.planeGroup = null;
    }

    clearMissiles();
}

export function startGame() {
    // Require a plane to be selected first
    if (!state.selectedPlane) {
        document.getElementById('start-screen').style.display = 'flex';
        document.getElementById('plane-hint').style.display   = 'block';
        return;
    }

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('end-screen').style.display   = 'none';
    document.getElementById('hud').style.display          = 'block';

    clearWorld();

    // Create the selected plane model
    state.planeGroup = state.selectedPlane === 'gripen' ? createGripen() : createF22();
    const startMeander = fjordMeander(0);
    state.planeGroup.position.set(startMeander, 200, 0);
    state.scene.add(state.planeGroup);

    // Reset flight state
    state.speed       = 250;
    state.throttle    = 0.5;
    state.afterburner = false;

    // Reset game state
    state.score        = 0;
    state.gameTime     = GAME_DURATION;
    state.gameRunning  = true;
    state.ringsPassed  = 0;

    resetMissiles();
    updateTerrain(0);
    generateRings();

    state.clock.start();
}

export function endGame(crashed) {
    state.gameRunning = false;
    state.clock.stop();

    const endTitle = document.getElementById('end-title');
    const endScore = document.getElementById('end-score');
    const endStats = document.getElementById('end-stats');

    if (crashed) {
        endTitle.textContent  = 'CRASHED!';
        endTitle.style.color  = '#e74c3c';
    } else {
        endTitle.textContent  = 'MISSION COMPLETE';
        endTitle.style.color  = '#2ecc71';
        state.score += 500;
    }

    endScore.textContent = state.score;
    endStats.innerHTML   =
        `Rings collected: ${state.ringsPassed} / ${NUM_RINGS}<br>` +
        `Ring score: ${state.ringsPassed * RING_SCORE}<br>` +
        (!crashed ? 'Survival bonus: 500<br>' : '') +
        `Time survived: ${GAME_DURATION - Math.ceil(state.gameTime)}s`;

    document.getElementById('hud').style.display       = 'none';
    document.getElementById('end-screen').style.display = 'flex';
}

export function selectPlane(type) {
    state.selectedPlane = type;
    document.querySelectorAll('.plane-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('card-' + type).classList.add('selected');
    document.getElementById('plane-hint').style.display = 'none';
}
