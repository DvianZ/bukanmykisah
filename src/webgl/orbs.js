import * as THREE from 'three';

/**
 * Orbs / Memory Lanterns
 * Bioluminescent warm amber beacons with celestial orbital halos and localized god-ray bloom.
 */
export class Orbs {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.orbs = [];
    this.initOrbs();
  }

  initOrbs() {
    const orbPositions = [
      new THREE.Vector3(-2.0, 3.5, 16),    // Babak 00
      new THREE.Vector3(5.5, 0.0, -10),    // Babak 01
      new THREE.Vector3(-3.0, 3.8, -34),   // Babak 02
      new THREE.Vector3(5.0, 1.8, -58),    // Babak 03
      new THREE.Vector3(-3.8, -0.5, -84),  // Babak 04
      new THREE.Vector3(3.8, 1.2, -102),   // Babak 05
      new THREE.Vector3(0.0, 1.8, -118)    // Babak 06
    ];

    const coreGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const auraGeo = new THREE.SphereGeometry(1.8, 24, 24);
    const ringGeo = new THREE.TorusGeometry(2.3, 0.025, 16, 80);

    orbPositions.forEach((pos, idx) => {
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xfff5e0),
        transparent: true,
        opacity: 0.98
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.copy(pos);

      const auraMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffaa00),
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      coreMesh.add(auraMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffd166),
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI * 0.35 + (idx * 0.2);
      ringMesh.rotation.y = idx * 0.4;
      coreMesh.add(ringMesh);

      const pointLight = new THREE.PointLight(0xffb703, 3.2, 32, 1.7);
      pointLight.position.copy(pos);
      this.group.add(pointLight);

      this.group.add(coreMesh);

      this.orbs.push({
        core: coreMesh,
        aura: auraMesh,
        ring: ringMesh,
        light: pointLight,
        basePos: pos.clone(),
        baseIntensity: 3.2,
        phase: idx * 1.15
      });
    });
  }

  update(delta, time) {
    this.orbs.forEach((orb) => {
      const floatY = Math.sin(time * 0.9 + orb.phase) * 0.45;
      orb.core.position.y = orb.basePos.y + floatY;
      orb.light.position.y = orb.basePos.y + floatY;

      const pulse = Math.sin(time * 1.8 + orb.phase);
      const intensity = orb.baseIntensity * (1.0 + pulse * 0.25);
      orb.light.intensity = intensity;

      const auraScale = 1.0 + pulse * 0.08;
      orb.aura.scale.set(auraScale, auraScale, auraScale);

      orb.ring.rotation.z += 0.4 * delta;
      orb.ring.rotation.x += 0.2 * delta;
    });
  }

  dispose() {
    this.orbs.forEach((o) => {
      o.core.geometry.dispose();
      o.core.material.dispose();
      o.aura.geometry.dispose();
      o.aura.material.dispose();
      o.ring.geometry.dispose();
      o.ring.material.dispose();
      this.group.remove(o.core);
      this.group.remove(o.light);
    });
    this.scene.remove(this.group);
  }
}
