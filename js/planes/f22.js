// ============================================================
//  FJORD SIMULATOR — F-22 Raptor (USA / Twin-engine stealth)
// ============================================================

import * as THREE from 'three';

export function createF22() {
    const g       = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x707070, specular: 0x333333, shininess: 60 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, specular: 0x222222, shininess: 50 });

    // Fuselage
    const fuse = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 10), bodyMat);
    fuse.scale.set(1, 0.55, 1);
    g.add(fuse);

    // Nose — forward tip at local -Z
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.5, 6), darkMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -7;
    nose.scale.set(1, 0.5, 1);
    g.add(nose);

    // Canopy
    const canopyMat = new THREE.MeshPhongMaterial({
        color: 0x88aacc, specular: 0xffffff, shininess: 100,
        transparent: true, opacity: 0.65,
    });
    const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        canopyMat
    );
    canopy.position.set(0, 0.3, -2);
    canopy.scale.set(0.7, 0.5, 1.5);
    g.add(canopy);

    // Delta wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(6.5, 1.5);
    wingShape.lineTo(6.5, 2);
    wingShape.lineTo(0, 4.5);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.12, bevelEnabled: false });

    const rw = new THREE.Mesh(wingGeo, bodyMat);
    rw.position.set(0.5, -0.08, -1);
    rw.rotation.x = -Math.PI / 2;
    g.add(rw);

    const lw = new THREE.Mesh(wingGeo, bodyMat);
    lw.position.set(-0.5, -0.08, -1);
    lw.rotation.x = -Math.PI / 2;
    lw.scale.x = -1;
    g.add(lw);

    // Twin angled tail fins
    const tailGeo = new THREE.BoxGeometry(0.12, 2.8, 2.5);
    const rt = new THREE.Mesh(tailGeo, bodyMat);
    rt.position.set(1.2, 1.1, 4);
    rt.rotation.z = -0.2;
    g.add(rt);
    const lt = new THREE.Mesh(tailGeo, bodyMat);
    lt.position.set(-1.2, 1.1, 4);
    lt.rotation.z = 0.2;
    g.add(lt);

    // Horizontal stabilators
    const hsGeo = new THREE.BoxGeometry(3.2, 0.08, 1.8);
    const rhs   = new THREE.Mesh(hsGeo, bodyMat);
    rhs.position.set(2.2, 0, 4.2);
    g.add(rhs);
    const lhs = new THREE.Mesh(hsGeo, bodyMat);
    lhs.position.set(-2.2, 0, 4.2);
    g.add(lhs);

    // Engine intakes
    const intGeo = new THREE.CylinderGeometry(0.45, 0.35, 2, 8);
    const intMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    const ri = new THREE.Mesh(intGeo, intMat);
    ri.position.set(0.8, -0.2, 2);
    ri.rotation.x = Math.PI / 2;
    g.add(ri);
    const li = new THREE.Mesh(intGeo, intMat);
    li.position.set(-0.8, -0.2, 2);
    li.rotation.x = Math.PI / 2;
    g.add(li);

    // Twin engine afterburner glow discs
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    const rGlow = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), glowMat.clone());
    rGlow.position.set(0.8, -0.2, 5.1);
    g.add(rGlow);
    const lGlow = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), glowMat.clone());
    lGlow.position.set(-0.8, -0.2, 5.1);
    g.add(lGlow);

    // userData.glows is used by the animate loop for engine glow animation
    g.userData.glows = [rGlow, lGlow];
    g.scale.set(1.5, 1.5, 1.5);
    return g;
}
