// ============================================================
//  FJORD SIMULATOR — Entry Point
//  init() wires everything together; animate() is the game loop.
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { createSky, createWater } from './environment.js';
import { updateTerrain } from './terrain.js';
import { updateFlight, checkCollisions } from './flight.js';
import { updateHUD, updateMinimap } from './hud.js';
import { updateMissiles } from './missiles.js';
import { animateRings } from './rings.js';
import { startGame, endGame, selectPlane } from './game.js';

// ---- Keyboard input ----------------------------------------
const gameKeys = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyG',
    'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
    'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

function setupInput() {
    window.addEventListener('keydown', e => {
        state.keys[e.code] = true;
        if (gameKeys.has(e.code) && state.gameRunning) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
        state.keys[e.code] = false;
        if (gameKeys.has(e.code)) e.preventDefault();
    });
}

// ---- Window resize -----------------------------------------
function onResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---- Scene / renderer setup --------------------------------
function init() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x7da4b8);
    state.scene.fog         = new THREE.FogExp2(0x7da4b8, 0.00022);

    state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 12000);
    state.camera.position.set(0, 120, 40);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.shadowMap.enabled  = true;
    state.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    state.renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.2;
    document.body.insertBefore(state.renderer.domElement, document.body.firstChild);

    // Lights
    state.scene.add(new THREE.AmbientLight(0x6688aa, 0.7));

    state.sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    state.sunLight.position.set(300, 600, -200);
    state.sunLight.castShadow                  = true;
    state.sunLight.shadow.camera.near          = 1;
    state.sunLight.shadow.camera.far           = 3000;
    state.sunLight.shadow.camera.left          = -1500;
    state.sunLight.shadow.camera.right         = 1500;
    state.sunLight.shadow.camera.top           = 1500;
    state.sunLight.shadow.camera.bottom        = -1500;
    state.sunLight.shadow.mapSize.width        = 2048;
    state.sunLight.shadow.mapSize.height       = 2048;
    state.scene.add(state.sunLight);
    state.scene.add(state.sunLight.target);

    state.scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a6a3a, 0.5));

    createSky();
    createWater();

    state.minimapCtx     = document.getElementById('minimap-canvas').getContext('2d');
    state.warningOverlay = document.getElementById('warning-overlay');

    setupInput();
    window.addEventListener('resize', onResize);

    // Plane selection cards
    document.getElementById('card-f22').addEventListener('click',    () => selectPlane('f22'));
    document.getElementById('card-gripen').addEventListener('click', () => selectPlane('gripen'));

    // Start / restart buttons
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-restart').addEventListener('click', () => {
        state.selectedPlane = null;
        document.querySelectorAll('.plane-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('end-screen').style.display   = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    });

    state.clock = new THREE.Clock();

    // Render one frame so the sky is visible behind the start screen
    state.renderer.render(state.scene, state.camera);
}

// ---- Game loop ---------------------------------------------
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt  = Math.min((now - lastTime) / 1000, 0.05);  // capped at 50 ms
    lastTime  = now;

    if (!state.gameRunning || dt <= 0) {
        state.renderer.render(state.scene, state.camera);
        return;
    }

    // Advance game time and add survival score
    state.gameTime -= dt;
    state.score    += Math.round(5 * dt);   // 5 pts/sec survival

    if (state.gameTime <= 0) {
        state.gameTime = 0;
        endGame(false);
        state.renderer.render(state.scene, state.camera);
        return;
    }

    updateFlight(dt);
    updateMissiles(dt);
    checkCollisions(endGame);
    if (!state.gameRunning) { state.renderer.render(state.scene, state.camera); return; }

    updateHUD();
    updateMinimap();
    updateTerrain(state.planeGroup.position.z);

    // Water plane follows the player (large but not infinite)
    state.waterMesh.position.x = state.planeGroup.position.x;
    state.waterMesh.position.z = state.planeGroup.position.z;
    state.waterMesh.material.uniforms.time.value += dt;

    // Animate rings
    animateRings(dt, state.clock.elapsedTime);

    // Engine glow animation
    if (state.planeGroup.userData.glows) {
        const intensity = state.afterburner ? 1.0 : state.throttle * 0.7;
        state.planeGroup.userData.glows.forEach(gl => {
            gl.material.opacity = 0.3 + intensity * 0.7;
            gl.material.color.setHex(state.afterburner ? 0x4488ff : 0xff6600);
            gl.scale.setScalar(0.8 + intensity * 0.4 + Math.random() * 0.1);
        });
    }

    state.renderer.render(state.scene, state.camera);
}

// ---- Bootstrap ---------------------------------------------
// Dynamically load Three.js (allows fallback CDN if one fails).
// Once loaded, boot() triggers init() and starts the loop.
function boot() {
    try {
        init();
        animate();
    } catch (e) {
        showError('Startup crash:\n' + e.message + '\n\n' + e.stack);
    }
}

function showError(msg) {
    const d = document.createElement('div');
    d.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
        'z-index:9999', 'background:#111', 'color:#f44',
        'font-family:monospace', 'padding:40px',
        'font-size:14px', 'white-space:pre-wrap', 'overflow:auto',
    ].join(';');
    d.textContent = 'FJORD SIMULATOR — ERROR:\n\n' + msg;
    document.body.appendChild(d);
}

window.onerror = (msg, url, line, col, err) => {
    showError(msg + '\nLine: ' + line + ':' + col + '\n\n' + (err && err.stack ? err.stack : ''));
};

// Run on DOMContentLoaded so all HTML elements exist
document.addEventListener('DOMContentLoaded', boot);
