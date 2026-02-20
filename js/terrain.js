// ============================================================
//  FJORD SIMULATOR — Terrain Generation & Streaming
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { MOUNTAIN_HEIGHT, CHUNK_SIZE, CHUNKS_AHEAD, CHUNKS_BEHIND } from './constants.js';

// Returns the horizontal meander offset of the fjord center at distance z
export function fjordMeander(z) {
    return Math.sin(z * 0.0005) * 120
         + Math.sin(z * 0.0002) * 180
         + Math.cos(z * 0.0008) * 80;
}

// Returns terrain height at world position (x, z_param)
// z_param = -worldZ  (positive = distance flown forward)
export function fjordHeight(x, z) {
    const meander  = fjordMeander(z);
    const localX   = x - meander;
    const absX     = Math.abs(localX);

    const progress    = Math.max(0, Math.min(z / 10000, 1));
    const currentWidth = 3000 - progress * 1800;   // 3000 → 1200
    const fjordHalf   = currentWidth / 2;
    const wallStart   = fjordHalf * 0.4;

    if (absX < wallStart) return -5;   // flat water floor

    let t = (absX - wallStart) / (fjordHalf - wallStart);
    t = Math.min(t, 1);

    let h = MOUNTAIN_HEIGHT * Math.pow(t, 0.55);

    // Rugged noise on the cliff walls
    h += (  Math.sin(x * 0.005 + z * 0.003) * 45
          + Math.sin(x * 0.013 + z * 0.009) * 22
          + Math.sin(x * 0.002 - z * 0.004) * 65
          + Math.cos(x * 0.009 + z * 0.007) * 30) * t;

    // Extra peaks outside the fjord walls
    if (absX > fjordHalf) {
        const et = Math.min((absX - fjordHalf) / 400, 1);
        h += (Math.sin(z * 0.001 + x * 0.002) * 120 + 60) * et;
    }

    return Math.max(h, -5);
}

export function createTerrainChunk(zStart) {
    const segs  = 50;
    const width = 4000;
    const geo   = new THREE.PlaneGeometry(width, CHUNK_SIZE, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos    = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = zStart - pos.getZ(i);
        const vy = fjordHeight(vx, vz);
        pos.setY(i, vy);

        // Vertex colour by height band
        let r, g, b;
        if (vy < 2) {
            r = 0.28; g = 0.28; b = 0.22;
        } else if (vy < 80) {
            const n = Math.random() * 0.04;
            r = 0.12 + n; g = 0.22 + n + vy * 0.0008; b = 0.08 + n;
        } else if (vy < 250) {
            const gr = 0.32 + Math.random() * 0.04 + (vy - 80) * 0.0008;
            r = gr * 0.88; g = gr; b = gr * 0.82;
        } else if (vy < 420) {
            const m  = (vy - 250) / 170;
            const rk = 0.42 + Math.random() * 0.04;
            r = rk + m * 0.42; g = rk + m * 0.42; b = rk + m * 0.48;
        } else {
            const s = 0.88 + Math.random() * 0.08;
            r = s; g = s; b = Math.min(1, s + 0.04);
        }
        colors[i * 3]     = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat  = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -zStart;
    mesh.receiveShadow = true;
    state.scene.add(mesh);

    // Scatter trees on mid-slope areas
    const trees    = [];
    const treeGeo  = new THREE.ConeGeometry(3.5, 18, 5);
    const treeMat  = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
    const trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 5, 4);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });

    for (let t = 0; t < 25; t++) {
        const tx = (Math.random() - 0.5) * width * 0.75;
        const tz = zStart + Math.random() * CHUNK_SIZE;
        const ty = fjordHeight(tx, tz);
        if (ty > 12 && ty < 140) {
            const treeGroup = new THREE.Group();
            const cone = new THREE.Mesh(treeGeo, treeMat);
            cone.position.y = 12;
            cone.scale.set(
                0.5 + Math.random() * 0.5,
                0.6 + Math.random() * 0.6,
                0.5 + Math.random() * 0.5
            );
            treeGroup.add(cone);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 2.5;
            treeGroup.add(trunk);
            treeGroup.position.set(tx, ty, -tz);
            state.scene.add(treeGroup);
            trees.push(treeGroup);
        }
    }

    return { mesh, zStart, trees };
}

export function updateTerrain(playerZ) {
    const cur = Math.floor(-playerZ / CHUNK_SIZE);

    for (let i = cur - CHUNKS_BEHIND; i < cur + CHUNKS_AHEAD; i++) {
        const zs = i * CHUNK_SIZE;
        if (!state.terrainChunks.find(c => c.zStart === zs)) {
            state.terrainChunks.push(createTerrainChunk(zs));
        }
    }

    state.terrainChunks = state.terrainChunks.filter(c => {
        const tooFarBehind = c.zStart < (cur - CHUNKS_BEHIND - 2) * CHUNK_SIZE;
        const tooFarAhead  = c.zStart > (cur + CHUNKS_AHEAD + 2) * CHUNK_SIZE;
        if (tooFarBehind || tooFarAhead) {
            state.scene.remove(c.mesh);
            c.mesh.geometry.dispose();
            c.mesh.material.dispose();
            c.trees.forEach(t => state.scene.remove(t));
            return false;
        }
        return true;
    });
}
