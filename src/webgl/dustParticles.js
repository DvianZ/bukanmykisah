import * as THREE from 'three';

/**
 * DustParticles
 * Dual-layer 3D cosmic dust / fireflies with GPU shader animation.
 */
export class DustParticles {
  constructor(scene) {
    this.scene = scene;
    this.count = 3500;
    this.init();
  }

  init() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const scales = new Float32Array(this.count);
    const phases = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);

    // Twilight color palette: warm amber, soft gold, celestial cyan-white, midnight lavender
    const palette = [
      new THREE.Color('#ffd166'),
      new THREE.Color('#ffb703'),
      new THREE.Color('#f5f6fa'),
      new THREE.Color('#d4b3ff'),
      new THREE.Color('#ff9e00')
    ];

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // Scatter around the camera spline bounding volume
      positions[i3] = (Math.random() - 0.5) * 36;
      positions[i3 + 1] = (Math.random() - 0.5) * 24;
      positions[i3 + 2] = (Math.random() - 0.5) * 170 - 55;

      scales[i] = Math.random() * 2.8 + 0.8;
      phases[i] = Math.random();

      const chosenColor = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    // Custom GLSL Shaders
    const vertexShader = `
      uniform float uTime;
      uniform float uDpr;
      
      attribute float aScale;
      attribute float aPhase;
      attribute vec3 aColor;
      
      varying vec3 vColor;
      varying float vPhase;

      void main() {
        vColor = aColor;
        vPhase = aPhase;

        vec3 pos = position;

        // GPU trigonometric noise drift
        float t = uTime * 0.4 + aPhase * 6.2831;
        pos.x += sin(t) * 0.6;
        pos.y += cos(t * 0.8) * 0.8;
        pos.z += sin(t * 0.5) * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Distance attenuation
        float dist = max(length(mvPosition.xyz), 1.0);
        gl_PointSize = aScale * (160.0 / dist) * uDpr;
        gl_PointSize = clamp(gl_PointSize, 1.0, 36.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      varying vec3 vColor;
      varying float vPhase;

      void main() {
        // Soft circular particle disc
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        // Smooth glow falloff
        float alpha = smoothstep(0.5, 0.05, dist);

        // Individual twinkle modulation
        float twinkle = 0.6 + 0.4 * sin(uTime * 2.2 + vPhase * 12.0);
        alpha *= twinkle;

        gl_FragColor = vec4(vColor, alpha * 0.85);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: Math.min(window.devicePixelRatio, 2) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, this.material);
    this.scene.add(this.points);
  }

  update(time) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
    }
  }

  onResize() {
    if (this.material) {
      this.material.uniforms.uDpr.value = Math.min(window.devicePixelRatio, 2);
    }
  }

  dispose() {
    if (this.points) {
      this.points.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.points);
    }
  }
}

