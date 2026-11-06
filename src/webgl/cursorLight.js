import * as THREE from 'three';

/**
 * CursorLight
 * 3D interactive fluid light trail responding to mouse velocity.
 */
export class CursorLight {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.maxSparks = 180;
    this.sparks = [];
    this.currentIndex = 0;

    this.mouse = new THREE.Vector2(0, 0);
    this.prevMouse = new THREE.Vector2(0, 0);
    this.mouseSpeed = 0;

    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.initSparks();
    this.bindEvents();
  }

  initSparks() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxSparks * 3);
    this.opacities = new Float32Array(this.maxSparks);
    this.sizes = new Float32Array(this.maxSparks);

    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        pos: new THREE.Vector3(9999, 9999, 9999),
        vel: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 1.0,
        baseSize: 12.0
      });
      this.opacities[i] = 0.0;
      this.sizes[i] = 0.0;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    const vertexShader = `
      attribute float aOpacity;
      attribute float aSize;
      varying float vOpacity;

      void main() {
        vOpacity = aOpacity;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * (150.0 / -mvPosition.z);
        gl_PointSize = clamp(gl_PointSize, 0.0, 48.0);
      }
    `;

    const fragmentShader = `
      varying float vOpacity;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        float glow = smoothstep(0.5, 0.0, dist);
        vec3 color = mix(vec3(1.0, 0.75, 0.2), vec3(1.0, 0.95, 0.8), glow);

        gl_FragColor = vec4(color, vOpacity * glow);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      const dx = this.mouse.x - this.prevMouse.x;
      const dy = this.mouse.y - this.prevMouse.y;
      this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);

      this.prevMouse.copy(this.mouse);

      // Spawn sparks when moving
      if (this.mouseSpeed > 0.003) {
        this.spawnSpark();
      }
    });
  }

  spawnSpark() {
    // Project ray from camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Virtual interaction plane located 12 units in front of camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    const planePoint = this.camera.position.clone().add(cameraDirection.clone().multiplyScalar(12));
    const interactionPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDirection.negate(), planePoint);

    const hitPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(interactionPlane, hitPoint)) {
      const spark = this.sparks[this.currentIndex];
      spark.pos.copy(hitPoint);
      spark.vel.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4 + 0.1,
        (Math.random() - 0.5) * 0.2
      );
      spark.life = 1.0;
      spark.maxLife = 0.8 + Math.random() * 0.6;
      spark.baseSize = 10.0 + Math.random() * 12.0;

      this.currentIndex = (this.currentIndex + 1) % this.maxSparks;
    }
  }

  update(delta) {
    const posAttr = this.geometry.attributes.position;
    const opAttr = this.geometry.attributes.aOpacity;
    const sizeAttr = this.geometry.attributes.aSize;

    for (let i = 0; i < this.maxSparks; i++) {
      const s = this.sparks[i];
      if (s.life > 0) {
        s.life -= delta / s.maxLife;
        s.pos.addScaledVector(s.vel, delta * 2.0);

        const progress = Math.max(0, s.life);
        posAttr.setXYZ(i, s.pos.x, s.pos.y, s.pos.z);
        opAttr.setX(i, Math.sin(progress * Math.PI));
        sizeAttr.setX(i, s.baseSize * progress);
      } else {
        opAttr.setX(i, 0.0);
        sizeAttr.setX(i, 0.0);
      }
    }

    posAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}

