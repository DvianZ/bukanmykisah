import * as THREE from 'three';

/**
 * Romantic Cinematic Background (No 3D Objects)
 * Features:
 * 1. Romantic Twilight to Date-Night Gradient Sky Shader with Streetlamp Aura
 * 2. Dreamy Floating Bokeh Orbs (Fairy Lights)
 * 3. Falling Rose & Cherry Blossom Petals with Organic Flutter
 * 4. Soft Twinkling Golden Fireflies & Star Dust
 * 5. Interactive Warm Candlelight Halo following cursor
 */

function createBokehTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 4;

  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(255, 235, 240, 0.85)');
  grad.addColorStop(0.7, 'rgba(255, 210, 225, 0.4)');
  grad.addColorStop(0.9, 'rgba(255, 190, 215, 0.12)');
  grad.addColorStop(1, 'rgba(255, 180, 210, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPetalTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.42);
  ctx.bezierCurveTo(size * 0.35, -size * 0.35, size * 0.38, size * 0.15, 0, size * 0.42);
  ctx.bezierCurveTo(-size * 0.38, size * 0.15, -size * 0.35, -size * 0.35, 0, -size * 0.42);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -size * 0.4, 0, size * 0.4);
  grad.addColorStop(0, 'rgba(255, 210, 220, 0.95)');
  grad.addColorStop(0.5, 'rgba(250, 160, 185, 0.85)');
  grad.addColorStop(1, 'rgba(235, 95, 135, 0.65)');

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFireflyTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 2;

  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, 'rgba(255, 255, 240, 1)');
  grad.addColorStop(0.2, 'rgba(255, 235, 160, 0.9)');
  grad.addColorStop(0.5, 'rgba(255, 190, 90, 0.35)');
  grad.addColorStop(1, 'rgba(255, 160, 60, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.scrollProgress = 0;
    this.targetProgress = 0;
    this.elapsedTime = 0;
    this.bloomMultiplier = 1.0;

    this.mouse = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);

    this.initEngine();
    this.createRomanticSky();
    this.createBokehOrbs();
    this.createFallingPetals();
    this.createFireflies();
    this.bindEvents();
  }

  initEngine() {
    this.scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 2D Camera setup for planar romantic atmosphere
    this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 100);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  createRomanticSky() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const skyGeo = new THREE.PlaneGeometry(width * 1.2, height * 1.2);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(width, height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec2 uMouse;
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          // Atmospheric color palettes
          // 1. Afternoon Dusk (Warm peach, soft mulberry, rich plum)
          vec3 duskTop = vec3(0.08, 0.06, 0.16);
          vec3 duskMid = vec3(0.32, 0.14, 0.24);
          vec3 duskBottom = vec3(0.65, 0.32, 0.22);

          // 2. Midnight Roadside Date (Deep indigo, romantic wine, warm streetlamp amber)
          vec3 nightTop = vec3(0.04, 0.03, 0.08);
          vec3 nightMid = vec3(0.14, 0.07, 0.18);
          vec3 nightBottom = vec3(0.42, 0.22, 0.12);

          vec3 colTop = mix(duskTop, nightTop, uProgress);
          vec3 colMid = mix(duskMid, nightMid, uProgress);
          vec3 colBottom = mix(duskBottom, nightBottom, uProgress);

          // Gentle romantic atmospheric wave
          float wave = sin(uv.x * 2.8 + uTime * 0.18) * 0.04;
          float t = clamp(uv.y + wave, 0.0, 1.0);

          vec3 sky = mix(colBottom, colMid, smoothstep(0.0, 0.55, t));
          sky = mix(sky, colTop, smoothstep(0.48, 1.0, t));

          // Warm streetlamp romantic glow in the lower region
          vec2 lampCenter = vec2(0.75, 0.15);
          float distToLamp = length((uv - lampCenter) * vec2(1.0, 1.3));
          float lampGlow = exp(-distToLamp * 2.4) * 0.45;
          sky += vec3(0.95, 0.62, 0.28) * lampGlow;

          // Soft cursor candlelight glow
          float distToCursor = length(uv - uMouse);
          float cursorGlow = exp(-distToCursor * 3.5) * 0.22;
          sky += vec3(1.0, 0.75, 0.5) * cursorGlow;

          // Cinematic vignette
          float vignette = smoothstep(1.3, 0.35, length(uv - 0.5));
          sky *= (0.78 + 0.22 * vignette);

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.skyMesh.position.z = -5;
    this.scene.add(this.skyMesh);
  }

  createBokehOrbs() {
    this.bokehTexture = createBokehTexture();
    const count = 48;

    this.bokehData = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Romantic palette for bokeh fairy lights
    const palette = [
      new THREE.Color(0xffd166), // warm amber gold
      new THREE.Color(0xff99c8), // soft blush rose
      new THREE.Color(0xfcb1a6), // peach glow
      new THREE.Color(0xe0b1cb), // dusky lavender
      new THREE.Color(0xffeedd)  // champagne ivory
    ];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width * 1.3;
      const y = (Math.random() - 0.5) * height * 1.3;
      const z = 0;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      const baseSize = 40 + Math.random() * 85;
      sizes[i] = baseSize;

      this.bokehData.push({
        baseX: x,
        baseY: y,
        speedY: 18 + Math.random() * 32,
        swaySpeed: 0.6 + Math.random() * 1.2,
        swayAmp: 25 + Math.random() * 45,
        phase: Math.random() * Math.PI * 2,
        baseSize: baseSize,
        pulseSpeed: 1.0 + Math.random() * 2.0
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.bokehMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.bokehTexture },
        uTime: { value: 0 }
      },
      vertexColors: true,
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * 1.3, tex.a * 0.72);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bokehPoints = new THREE.Points(geometry, this.bokehMat);
    this.scene.add(this.bokehPoints);
  }

  createFallingPetals() {
    this.petalTexture = createPetalTexture();
    const count = 42;
    this.petals = [];

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const planeGeo = new THREE.PlaneGeometry(18, 26);
      const mat = new THREE.MeshBasicMaterial({
        map: this.petalTexture,
        transparent: true,
        opacity: 0.75 + Math.random() * 0.2,
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(planeGeo, mat);
      const x = (Math.random() - 0.5) * width * 1.3;
      const y = (Math.random() - 0.5) * height * 1.3;
      mesh.position.set(x, y, 1);

      const scale = 0.6 + Math.random() * 0.7;
      mesh.scale.set(scale, scale, scale);

      this.scene.add(mesh);

      this.petals.push({
        mesh: mesh,
        x: x,
        y: y,
        speedY: 28 + Math.random() * 40,
        swaySpeed: 0.8 + Math.random() * 1.4,
        swayAmp: 30 + Math.random() * 50,
        rotSpeedZ: (Math.random() - 0.5) * 1.8,
        flipSpeed: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        baseScale: scale
      });
    }
  }

  createFireflies() {
    this.fireflyTexture = createFireflyTexture();
    const count = 75;

    this.fireflyData = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width * 1.2;
      const y = (Math.random() - 0.5) * height * 1.2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 2;

      // Warm candlelit golden color
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.82 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.45;

      const baseSize = 8 + Math.random() * 16;
      sizes[i] = baseSize;

      this.fireflyData.push({
        baseX: x,
        baseY: y,
        speedY: 10 + Math.random() * 20,
        swaySpeed: 1.2 + Math.random() * 1.8,
        swayAmp: 15 + Math.random() * 25,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 2.0 + Math.random() * 3.5,
        baseSize: baseSize
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.fireflyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.fireflyTexture }
      },
      vertexColors: true,
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * 1.5, tex.a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflyPoints = new THREE.Points(geometry, this.fireflyMat);
    this.scene.add(this.fireflyPoints);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        this.onMouseMove(e.touches[0]);
      }
    }, { passive: true });
  }

  onMouseMove(e) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.targetMouse.x = e.clientX / width;
    this.targetMouse.y = 1.0 - (e.clientY / height);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.skyMesh) {
      this.skyMesh.geometry.dispose();
      this.skyMesh.geometry = new THREE.PlaneGeometry(width * 1.2, height * 1.2);
      if (this.skyMat.uniforms.uResolution) {
        this.skyMat.uniforms.uResolution.value.set(width, height);
      }
    }
  }

  setScrollProgress(progress) {
    this.targetProgress = progress;
  }

  setBloomMultiplier(multiplier) {
    this.bloomMultiplier = multiplier;
  }

  update(delta) {
    this.elapsedTime += delta;

    // Smooth progress interpolation
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * 0.08;

    // Smooth mouse interpolation
    this.mouse.lerp(this.targetMouse, 0.06);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfH = height / 2;
    const halfW = width / 2;

    // 1. Update Sky Shader
    if (this.skyMat) {
      this.skyMat.uniforms.uTime.value = this.elapsedTime;
      this.skyMat.uniforms.uProgress.value = this.scrollProgress;
      this.skyMat.uniforms.uMouse.value.copy(this.mouse);
    }

    // 2. Update Bokeh Fairy Lights (floating upwards)
    if (this.bokehPoints) {
      const posAttr = this.bokehPoints.geometry.attributes.position;
      const sizeAttr = this.bokehPoints.geometry.attributes.size;

      for (let i = 0; i < this.bokehData.length; i++) {
        const item = this.bokehData[i];
        item.baseY += item.speedY * delta;

        // Reset when drifted beyond top
        if (item.baseY > halfH + 80) {
          item.baseY = -halfH - 80;
          item.baseX = (Math.random() - 0.5) * width * 1.3;
        }

        const sway = Math.sin(this.elapsedTime * item.swaySpeed + item.phase) * item.swayAmp;
        const pulse = 0.88 + 0.12 * Math.sin(this.elapsedTime * item.pulseSpeed + item.phase);

        posAttr.setXY(i, item.baseX + sway, item.baseY);
        sizeAttr.setX(i, item.baseSize * pulse * this.bloomMultiplier);
      }

      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }

    // 3. Update Falling Rose Petals (drifting downwards and fluttering)
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.y -= p.speedY * delta;

      // Reset when fallen below bottom
      if (p.y < -halfH - 40) {
        p.y = halfH + 40;
        p.x = (Math.random() - 0.5) * width * 1.3;
      }

      const sway = Math.sin(this.elapsedTime * p.swaySpeed + p.phase) * p.swayAmp;
      p.mesh.position.set(p.x + sway, p.y, 1);

      // Organic 2D/3D tumbling flutter
      p.mesh.rotation.z += p.rotSpeedZ * delta;
      const flip = Math.sin(this.elapsedTime * p.flipSpeed + p.phase);
      p.mesh.scale.x = p.baseScale * flip;
    }

    // 4. Update Twinkling Fireflies
    if (this.fireflyPoints) {
      const posAttr = this.fireflyPoints.geometry.attributes.position;
      const sizeAttr = this.fireflyPoints.geometry.attributes.size;

      for (let i = 0; i < this.fireflyData.length; i++) {
        const item = this.fireflyData[i];
        item.baseY += item.speedY * delta;

        if (item.baseY > halfH + 40) {
          item.baseY = -halfH - 40;
          item.baseX = (Math.random() - 0.5) * width * 1.2;
        }

        const sway = Math.cos(this.elapsedTime * item.swaySpeed + item.phase) * item.swayAmp;
        const twinkle = 0.4 + 0.6 * Math.pow(Math.sin(this.elapsedTime * item.twinkleSpeed + item.phase), 4.0);

        posAttr.setXY(i, item.baseX + sway, item.baseY);
        sizeAttr.setX(i, item.baseSize * twinkle);
      }

      posAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', () => this.onResize());

    if (this.skyMesh) {
      this.skyMesh.geometry.dispose();
      this.skyMat.dispose();
    }

    if (this.bokehPoints) {
      this.bokehPoints.geometry.dispose();
      this.bokehMat.dispose();
      this.bokehTexture.dispose();
    }

    for (let p of this.petals) {
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    if (this.petalTexture) this.petalTexture.dispose();

    if (this.fireflyPoints) {
      this.fireflyPoints.geometry.dispose();
      this.fireflyMat.dispose();
      this.fireflyTexture.dispose();
    }

    this.renderer.dispose();
  }
}
