import * as THREE from 'three';

/**
 * CameraSpline
 * Defines a smooth 3D Catmull-Rom spline trajectory for the camera.
 * Progress is driven from 0.0 (Babak 00) to 1.0 (Babak 06).
 */
export class CameraSpline {
  constructor() {
    this.points = [
      new THREE.Vector3(0, 2, 28),      // Babak 00: Titik Temu Lantai Satu
      new THREE.Vector3(-5, 1, 10),     // Babak 01: Di Balik Kacamata
      new THREE.Vector3(6, -1, -14),    // Babak 02: Lorong & Pintu Kayu
      new THREE.Vector3(-4, 3, -38),    // Babak 03: Dinginnya Perpustakaan
      new THREE.Vector3(5, 0.5, -62),   // Babak 04: Sentuhan & Bisikan
      new THREE.Vector3(-4, -1.5, -88), // Babak 05: Janji di Parkiran Sore
      new THREE.Vector3(0, 1.2, -115),  // Babak 06: Hangat di Tepian Jalan
      new THREE.Vector3(0, 2.8, -140)   // Final horizon buffer
    ];

    this.curve = new THREE.CatmullRomCurve3(this.points, false, 'catmullrom', 0.5);

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.parallaxStrength = 1.8;

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  update(camera, progress, delta) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0.0001, 0.999);

    this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouse.targetX, 0.05);
    this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouse.targetY, 0.05);

    const camPos = this.curve.getPointAt(clampedProgress);
    const lookAheadProgress = Math.min(clampedProgress + 0.04, 1.0);
    const targetPos = this.curve.getPointAt(lookAheadProgress);

    camera.position.x = camPos.x + this.mouse.x * this.parallaxStrength;
    camera.position.y = camPos.y + this.mouse.y * (this.parallaxStrength * 0.7);
    camera.position.z = camPos.z;

    const lookTarget = targetPos.clone();
    lookTarget.x += this.mouse.x * (this.parallaxStrength * 0.4);
    lookTarget.y += this.mouse.y * (this.parallaxStrength * 0.4);

    camera.lookAt(lookTarget);
  }
}
