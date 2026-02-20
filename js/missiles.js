// ============================================================
//  FJORD SIMULATOR — Missile System
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { MISSILE_SPEED, MISSILE_MAX_RANGE, MISSILE_COOLDOWN, MISSILE_MAX_AMMO, WATER_LEVEL } from './constants.js';
import { fjordHeight } from './terrain.js';

function createMissileMesh() {
    const mg = new THREE.Group();

    // Cylinder body aligned along -Z
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, specular: 0x888888, shininess: 80 });
    const body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    mg.add(body);

    // Nose cone
    const noseGeo = new THREE.ConeGeometry(0.12, 0.5, 6);
    const noseMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const noseM   = new THREE.Mesh(noseGeo, noseMat);
    noseM.rotation.x = Math.PI / 2;
    noseM.position.z = -1.15;
    mg.add(noseM);

    // Rear engine glow
    const glowGeo  = new THREE.CircleGeometry(0.10, 6);
    const glowMat  = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.9 });
    const glowDisc = new THREE.Mesh(glowGeo, glowMat);
    glowDisc.position.z = 0.92;
    mg.add(glowDisc);

    // Four tail fins
    const finGeo = new THREE.BoxGeometry(0.04, 0.3, 0.4);
    const finMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.rotation.z = (i * Math.PI / 2) + Math.PI / 4;
        fin.position.z = 0.6;
        mg.add(fin);
    }

    return mg;
}

export function fireMissile() {
    if (state.missileCount <= 0 || state.missileCooldown > 0) return;

    const mesh = createMissileMesh();

    // Spawn ~8 units ahead of the plane's centre in world space
    const spawnOffset = new THREE.Vector3(0, 0, -8).applyQuaternion(state.planeGroup.quaternion);
    mesh.position.copy(state.planeGroup.position).add(spawnOffset);
    mesh.quaternion.copy(state.planeGroup.quaternion);

    const forward  = new THREE.Vector3(0, 0, -1).applyQuaternion(state.planeGroup.quaternion);
    const velocity = forward.multiplyScalar(MISSILE_SPEED + state.speed);

    state.scene.add(mesh);
    state.missiles.push({ mesh, velocity, distanceTraveled: 0 });

    state.missileCount--;
    state.missileCooldown = MISSILE_COOLDOWN;
}

export function updateMissiles(dt) {
    if (state.missileCooldown > 0) {
        state.missileCooldown = Math.max(0, state.missileCooldown - dt);
    }

    // Fire on G key — reset immediately to prevent hold-to-spam
    if (state.keys['KeyG'] && state.gameRunning) {
        fireMissile();
        state.keys['KeyG'] = false;
    }

    for (let i = state.missiles.length - 1; i >= 0; i--) {
        const m    = state.missiles[i];
        const step = m.velocity.clone().multiplyScalar(dt);
        m.mesh.position.add(step);
        m.distanceTraveled += step.length();

        const mp         = m.mesh.position;
        const expired    = m.distanceTraveled > MISSILE_MAX_RANGE;
        const hitTerrain = mp.y < fjordHeight(mp.x, -mp.z) + 2;
        const hitWater   = mp.y < WATER_LEVEL + 1;
        const tooHigh    = mp.y > 1050;

        if (expired || hitTerrain || hitWater || tooHigh) {
            state.scene.remove(m.mesh);
            m.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            state.missiles.splice(i, 1);
        }
    }
}

export function resetMissiles() {
    state.missileCount   = MISSILE_MAX_AMMO;
    state.missileCooldown = 0;
}

export function clearMissiles() {
    state.missiles.forEach(m => {
        state.scene.remove(m.mesh);
        m.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    });
    state.missiles = [];
}
