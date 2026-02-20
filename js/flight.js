// ============================================================
//  FJORD SIMULATOR — Flight Physics & Collision Detection
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { AFTERBURNER_MULT, RING_SCORE, WATER_LEVEL } from './constants.js';
import { fjordHeight } from './terrain.js';

// Called once per frame while gameRunning === true
export function updateFlight(dt) {
    // Throttle input
    if (state.keys['ShiftLeft'] || state.keys['ShiftRight']) {
        state.throttle = Math.min(1, state.throttle + dt * 0.5);
    }
    if (state.keys['ControlLeft'] || state.keys['ControlRight']) {
        state.throttle = Math.max(0.05, state.throttle - dt * 0.5);
    }
    state.afterburner = !!state.keys['Space'];

    // Gripen is faster at the top but gains agility; F-22 has higher raw top speed
    const isGripen    = state.selectedPlane === 'gripen';
    let targetSpeed   = isGripen ? (100 + state.throttle * 340) : (120 + state.throttle * 380);
    if (state.afterburner) targetSpeed *= AFTERBURNER_MULT;
    state.speed += (targetSpeed - state.speed) * dt * 2;

    // Rotation rates (Gripen = more agile)
    const roll  = (isGripen ? 3.4 : 2.8) * dt;
    const pitch = (isGripen ? 2.2 : 1.8) * dt;
    const yaw   = (isGripen ? 1.3 : 1.0) * dt;

    // WASD and arrow keys both work
    if (state.keys['KeyA']     || state.keys['ArrowLeft'])  state.planeGroup.rotateZ(roll);
    if (state.keys['KeyD']     || state.keys['ArrowRight']) state.planeGroup.rotateZ(-roll);
    if (state.keys['KeyW']     || state.keys['ArrowUp'])    state.planeGroup.rotateX(-pitch);
    if (state.keys['KeyS']     || state.keys['ArrowDown'])  state.planeGroup.rotateX(pitch);
    if (state.keys['KeyQ'])                                  state.planeGroup.rotateY(yaw);
    if (state.keys['KeyE'])                                  state.planeGroup.rotateY(-yaw);

    // Move forward along local -Z
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.planeGroup.quaternion);
    state.planeGroup.position.addScaledVector(forward, state.speed * dt);

    // Gravity when not wings-level
    const planeUp = new THREE.Vector3(0, 1, 0).applyQuaternion(state.planeGroup.quaternion);
    const upDot   = new THREE.Vector3(0, 1, 0).dot(planeUp);
    if (upDot < 0.95) {
        state.planeGroup.position.y -= (1 - upDot) * 40 * dt;
    }

    // Camera — lerp to position behind/above the plane
    const camOffset = new THREE.Vector3(0, 6, 28).applyQuaternion(state.planeGroup.quaternion);
    const targetCam = state.planeGroup.position.clone().add(camOffset);
    state.camera.position.lerp(targetCam, Math.min(1, dt * 6));

    const lookTarget = state.planeGroup.position.clone().add(
        new THREE.Vector3(0, 1, -50).applyQuaternion(state.planeGroup.quaternion)
    );
    state.camera.lookAt(lookTarget);

    // Slide sun light with the player for consistent shadows
    state.sunLight.position.set(
        state.planeGroup.position.x + 300,
        600,
        state.planeGroup.position.z - 200
    );
    state.sunLight.target.position.copy(state.planeGroup.position);
    state.sunLight.target.updateMatrixWorld();
}

// Returns true if the game should end (crash)
export function checkCollisions(endGameFn) {
    const p = state.planeGroup.position;

    if (p.y < fjordHeight(p.x, -p.z) + 5) { endGameFn(true); return; }
    if (p.y < WATER_LEVEL + 2)             { endGameFn(true); return; }
    if (p.y > 1000) state.planeGroup.position.y = 1000;

    // Ring collection
    for (const ring of state.rings) {
        if (ring.userData.passed) continue;
        if (p.distanceTo(ring.position) < ring.userData.radius + 12) {
            ring.userData.passed = true;
            state.ringsPassed++;
            state.score += RING_SCORE;
            ring.children.forEach(ch => {
                if (ch.material) {
                    ch.material.color.setHex(0x00ff00);
                    if (ch.material.emissive) ch.material.emissive.setHex(0x006600);
                    ch.material.transparent = true;
                }
            });
            ring.userData.fadeTime = 0;
        }
    }
}
