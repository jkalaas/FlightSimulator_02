// ============================================================
//  FJORD SIMULATOR — Sky & Water
// ============================================================

import * as THREE from 'three';
import { state } from './state.js';
import { WATER_LEVEL } from './constants.js';

export function createSky() {
    const skyGeo = new THREE.SphereGeometry(7000, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
            topColor:    { value: new THREE.Color(0x1a3a5c) },
            midColor:    { value: new THREE.Color(0x7da4b8) },
            bottomColor: { value: new THREE.Color(0xc8d8e4) },
            sunColor:    { value: new THREE.Color(0xffe8c0) },
            sunDir:      { value: new THREE.Vector3(0.3, 0.5, -0.3).normalize() },
        },
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vWorldPos = (modelMatrix * vec4(position,1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor, midColor, bottomColor, sunColor;
            uniform vec3 sunDir;
            varying vec3 vWorldPos;
            void main() {
                vec3 d = normalize(vWorldPos);
                float y = d.y;
                vec3 col = y > 0.0
                    ? mix(midColor, topColor, pow(y, 0.5))
                    : mix(midColor, bottomColor, pow(-y, 0.4));
                float sd = max(dot(d, sunDir), 0.0);
                col += sunColor * pow(sd, 80.0) * 2.0;
                col += sunColor * pow(sd, 8.0) * 0.35;
                gl_FragColor = vec4(col, 1.0);
            }
        `,
    });
    state.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Scattered cloud planes
    const cloudMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.2,
        side: THREE.DoubleSide, depthWrite: false,
    });
    for (let i = 0; i < 50; i++) {
        const cloud = new THREE.Mesh(
            new THREE.PlaneGeometry(200 + Math.random() * 500, 80 + Math.random() * 200),
            cloudMat.clone()
        );
        cloud.material.opacity = 0.1 + Math.random() * 0.15;
        cloud.position.set(
            (Math.random() - 0.5) * 6000,
            350 + Math.random() * 500,
            (Math.random() - 0.5) * 12000
        );
        cloud.rotation.x = -Math.PI / 2;
        state.scene.add(cloud);
    }
}

export function createWater() {
    const geo = new THREE.PlaneGeometry(12000, 20000, 1, 1);
    const mat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
            time:         { value: 0 },
            deepColor:    { value: new THREE.Color(0x0a3050) },
            shallowColor: { value: new THREE.Color(0x1a6080) },
        },
        vertexShader: `
            varying vec3 vWP;
            void main() {
                vWP = (modelMatrix * vec4(position,1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 deepColor, shallowColor;
            varying vec3 vWP;
            void main() {
                float w = sin(vWP.x*0.015+time*0.8)*cos(vWP.z*0.01+time*0.5)*0.5+0.5;
                float s = sin(vWP.x*0.08+time*2.0)*sin(vWP.z*0.06+time*1.3)*0.5+0.5;
                vec3 c = mix(deepColor, shallowColor, w*0.4 + s*0.15);
                c += vec3(0.15,0.12,0.08) * pow(s, 3.0) * w;
                gl_FragColor = vec4(c, 0.88);
            }
        `,
    });
    state.waterMesh = new THREE.Mesh(geo, mat);
    state.waterMesh.rotation.x = -Math.PI / 2;
    state.waterMesh.position.y = WATER_LEVEL - 0.5;
    state.scene.add(state.waterMesh);
}
