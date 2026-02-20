// ============================================================
//  FJORD SIMULATOR — Collectible Rings
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { NUM_RINGS } from './constants.js';
import { fjordMeander } from './terrain.js';

function createRing(pos) {
    const rg = new THREE.Group();

    const ringMat = new THREE.MeshPhongMaterial({
        color: 0xff0000, emissive: 0x660000, specular: 0xff4444, shininess: 80,
    });
    rg.add(new THREE.Mesh(new THREE.TorusGeometry(45, 3, 12, 36), ringMat));

    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5 });
    rg.add(new THREE.Mesh(new THREE.TorusGeometry(45, 1, 8, 36), glowMat));

    const discMat = new THREE.MeshBasicMaterial({
        color: 0xff2200, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    });
    rg.add(new THREE.Mesh(new THREE.CircleGeometry(43, 24), discMat));

    rg.position.copy(pos);
    rg.userData = {
        passed:      false,
        radius:      45,
        originalPos: pos.clone(),
        bob:         Math.random() * Math.PI * 2,
    };

    state.scene.add(rg);
    return rg;
}

export function generateRings() {
    state.rings.forEach(r => state.scene.remove(r));
    state.rings       = [];
    state.ringsPassed = 0;

    const spacing = 1050;
    for (let i = 0; i < NUM_RINGS; i++) {
        const fz      = 300 + i * spacing;
        const meander = fjordMeander(fz);

        // Gentle weaving path so the player must steer in XY
        const xWave = Math.sin(i * 0.9) * 60 + Math.cos(i * 0.5) * 40;
        const yWave = Math.sin(i * 0.7 + 1.0) * 35 + Math.cos(i * 1.1) * 25;

        const x = meander + xWave;
        const y = 120 + yWave;

        const ring = createRing(new THREE.Vector3(x, y, -fz));
        ring.rotation.set(0, 0, 0);
        state.rings.push(ring);
    }
}

// Animate ring bob and fade-out on collection — called every frame
export function animateRings(dt, elapsedTime) {
    for (const ring of state.rings) {
        if (!ring.userData.passed) {
            ring.position.y =
                ring.userData.originalPos.y + Math.sin(elapsedTime * 2 + ring.userData.bob) * 3;
        } else if (ring.userData.fadeTime !== undefined) {
            ring.userData.fadeTime += dt;
            const op = 1 - ring.userData.fadeTime * 2;
            if (op <= 0) {
                state.scene.remove(ring);
                ring.userData.fadeTime = undefined;
            } else {
                ring.scale.multiplyScalar(1 + dt * 2);
                ring.children.forEach(ch => {
                    if (ch.material) ch.material.opacity = Math.max(0, op);
                });
            }
        }
    }
}
