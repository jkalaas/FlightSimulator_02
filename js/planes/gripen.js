// ============================================================
//  FJORD SIMULATOR — JAS 39 Gripen (Sweden / Delta-canard)
// ============================================================
//  Visual differences vs F-22:
//    • Blue-gray colour scheme
//    • Slimmer fuselage
//    • Sharper, longer nose
//    • Large steeply-swept delta wings
//    • Forward canard surfaces (Gripen signature)
//    • Single centre vertical tail
//    • Single centre engine / one glow disc
// ============================================================

import * as THREE from 'three';

export function createGripen() {
    const g = new THREE.Group();

    const bodyMat   = new THREE.MeshPhongMaterial({ color: 0x6a7a8a, specular: 0x2a3a4a, shininess: 70 });
    const darkMat   = new THREE.MeshPhongMaterial({ color: 0x3a4a55, specular: 0x1a2a35, shininess: 50 });
    const accentMat = new THREE.MeshPhongMaterial({ color: 0x8a9aaa, specular: 0x4a5a6a, shininess: 60 });

    // Fuselage — slimmer than F-22
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 11), bodyMat);
    fuse.scale.set(1, 0.6, 1);
    g.add(fuse);

    // Belly widening for single engine
    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 8), darkMat);
    belly.position.set(0, -0.18, 0.5);
    belly.scale.set(1, 0.5, 1);
    g.add(belly);

    // Nose — sharper and longer
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 5.5, 6), darkMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -7.8;
    nose.scale.set(0.85, 0.45, 1);
    g.add(nose);

    // Canopy — more reclining profile
    const canopyMat = new THREE.MeshPhongMaterial({
        color: 0x6699bb, specular: 0xffffff, shininess: 120,
        transparent: true, opacity: 0.6,
    });
    const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        canopyMat
    );
    canopy.position.set(0, 0.28, -2.8);
    canopy.scale.set(0.65, 0.42, 1.9);
    g.add(canopy);

    // Main delta wings — large steep sweep
    const mainWingShape = new THREE.Shape();
    mainWingShape.moveTo(0, -1.5);
    mainWingShape.lineTo(6.0, 2.5);
    mainWingShape.lineTo(6.0, 3.2);
    mainWingShape.lineTo(0, 3.8);
    mainWingShape.closePath();
    const mainWingGeo = new THREE.ExtrudeGeometry(mainWingShape, { depth: 0.10, bevelEnabled: false });

    const rMainWing = new THREE.Mesh(mainWingGeo, bodyMat);
    rMainWing.position.set(0.5, -0.08, -0.5);
    rMainWing.rotation.x = -Math.PI / 2;
    g.add(rMainWing);

    const lMainWing = new THREE.Mesh(mainWingGeo, bodyMat);
    lMainWing.position.set(-0.5, -0.08, -0.5);
    lMainWing.rotation.x = -Math.PI / 2;
    lMainWing.scale.x = -1;
    g.add(lMainWing);

    // Canard surfaces — Gripen's signature forward wings
    const canardShape = new THREE.Shape();
    canardShape.moveTo(0, 0);
    canardShape.lineTo(2.4, 0.8);
    canardShape.lineTo(2.4, 1.2);
    canardShape.lineTo(0, 0.9);
    canardShape.closePath();
    const canardGeo = new THREE.ExtrudeGeometry(canardShape, { depth: 0.08, bevelEnabled: false });

    const rCanard = new THREE.Mesh(canardGeo, accentMat);
    rCanard.position.set(0.4, -0.03, -4.0);
    rCanard.rotation.x = -Math.PI / 2;
    g.add(rCanard);

    const lCanard = new THREE.Mesh(canardGeo, accentMat);
    lCanard.position.set(-0.4, -0.03, -4.0);
    lCanard.rotation.x = -Math.PI / 2;
    lCanard.scale.x = -1;
    g.add(lCanard);

    // Single centre vertical tail
    const tailGeo = new THREE.BoxGeometry(0.14, 3.2, 2.8);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 1.4, 3.8);
    g.add(tail);

    // Small horizontal stabilators near tail
    const stabGeo = new THREE.BoxGeometry(2.4, 0.07, 1.4);
    const rStab   = new THREE.Mesh(stabGeo, bodyMat);
    rStab.position.set(1.6, -0.05, 4.0);
    g.add(rStab);
    const lStab = new THREE.Mesh(stabGeo, bodyMat);
    lStab.position.set(-1.6, -0.05, 4.0);
    g.add(lStab);

    // Single centre engine intake
    const intGeo = new THREE.CylinderGeometry(0.55, 0.42, 2.4, 10);
    const intMat = new THREE.MeshPhongMaterial({ color: 0x1e2a32 });
    const intake = new THREE.Mesh(intGeo, intMat);
    intake.position.set(0, -0.28, 1.5);
    intake.rotation.x = Math.PI / 2;
    g.add(intake);

    // Single engine glow disc
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    const glow    = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), glowMat);
    glow.position.set(0, -0.28, 5.85);
    g.add(glow);

    // Single element — compatible with animate() glow loop
    g.userData.glows = [glow];
    g.scale.set(1.5, 1.5, 1.5);
    return g;
}
