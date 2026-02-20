// ============================================================
//  FJORD SIMULATOR — HUD & Minimap
// ============================================================

import { state } from './state.js';
import { GAME_DURATION, NUM_RINGS } from './constants.js';
import { fjordHeight, fjordMeander } from './terrain.js';

export function updateHUD() {
    document.getElementById('hud-speed').textContent    = Math.round(state.speed);
    document.getElementById('hud-alt').textContent      = Math.round(state.planeGroup.position.y * 3.28);
    document.getElementById('hud-throttle').textContent = Math.round(state.throttle * 100);
    document.getElementById('hud-rings').textContent    = `${state.ringsPassed}/${NUM_RINGS}`;
    document.getElementById('hud-score').textContent    = state.score;

    // Missile counter
    document.getElementById('hud-missiles').textContent = state.missileCount;
    const mslReady = document.getElementById('hud-msl-ready');
    if (state.missileCooldown > 0) {
        mslReady.textContent  = ' ' + state.missileCooldown.toFixed(1) + 's';
        mslReady.style.color  = '#ff8800';
    } else if (state.missileCount > 0) {
        mslReady.textContent  = ' RDY';
        mslReady.style.color  = '#0f0';
    } else {
        mslReady.textContent  = ' EMPTY';
        mslReady.style.color  = '#f44';
    }

    // Timer display and bar
    const mins = Math.floor(state.gameTime / 60);
    const secs = Math.floor(state.gameTime % 60);
    document.getElementById('hud-timer').textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const pct = (state.gameTime / GAME_DURATION) * 100;
    const bar = document.getElementById('timer-bar');
    bar.style.width = pct + '%';
    if (pct < 25)      bar.style.background = 'linear-gradient(90deg,#e74c3c,#c0392b)';
    else if (pct < 50) bar.style.background = 'linear-gradient(90deg,#f39c12,#e67e22)';

    // Ground proximity warning
    const p         = state.planeGroup.position;
    const terrainY  = fjordHeight(p.x, -p.z);
    const clearance = p.y - terrainY;
    const w         = document.getElementById('hud-warning');

    if (clearance < 25) {
        w.textContent                     = 'PULL UP';
        w.style.color                     = '#ff0000';
        state.warningOverlay.style.opacity = '1';
    } else if (clearance < 55) {
        w.textContent                     = 'LOW ALTITUDE';
        w.style.color                     = '#ff8800';
        state.warningOverlay.style.opacity = '0.3';
    } else {
        w.textContent                     = '';
        state.warningOverlay.style.opacity = '0';
    }
}

export function updateMinimap() {
    const ctx = state.minimapCtx;
    ctx.clearRect(0, 0, 150, 150);
    ctx.fillStyle = 'rgba(0,20,0,0.6)';
    ctx.beginPath();
    ctx.arc(75, 75, 73, 0, Math.PI * 2);
    ctx.fill();

    const px = state.planeGroup.position.x;
    const pz = state.planeGroup.position.z;
    const s  = 0.012;

    // Fjord outline (approximate)
    ctx.strokeStyle = 'rgba(0,100,0,0.3)';
    ctx.lineWidth   = 1;
    for (let dz = -6000; dz < 6000; dz += 200) {
        const wz      = pz + dz;
        const meander = fjordMeander(-wz);
        const fz      = -wz;
        const prog    = Math.max(0, Math.min(fz / 10000, 1));
        const cw      = 3000 - prog * 1800;
        const sx1     = 75 + (meander - cw / 2 * 0.4 - px) * s;
        const sz      = 75 + dz * s;
        const sx2     = 75 + (meander + cw / 2 * 0.4 - px) * s;
        if (sz > 5 && sz < 145) {
            ctx.fillStyle = 'rgba(0,60,0,0.3)';
            ctx.fillRect(Math.max(5, sx1), sz, Math.min(140, sx2) - Math.max(5, sx1), 2);
        }
    }

    // Ring dots
    for (const ring of state.rings) {
        if (ring.userData.passed) continue;
        const rx = 75 + (ring.position.x - px) * s;
        const rz = 75 + (ring.position.z - pz) * s;
        if (rx > 5 && rx < 145 && rz > 5 && rz < 145) {
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.arc(rx, rz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Next ring indicator (clamped to edge of minimap)
    const next = state.rings.find(r => !r.userData.passed);
    if (next) {
        let rx     = 75 + (next.position.x - px) * s;
        let rz     = 75 + (next.position.z - pz) * s;
        const dx   = rx - 75, dy = rz - 75;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 65) { rx = 75 + dx / dist * 65; rz = 75 + dy / dist * 65; }
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(rx, rz, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Player triangle
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(75, 70);
    ctx.lineTo(72, 80);
    ctx.lineTo(78, 80);
    ctx.closePath();
    ctx.fill();
}
