import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Custom Cinematic Color Grading, Vignette & Film Grain Shader
 */
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignetteDarkness: { value: 0.8 },
    uVignetteOffset: { value: 1.0 },
    uGrainIntensity: { value: 0.04 },
    uChromaticAberration: { value: 0.003 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uGrainIntensity;
    uniform float uChromaticAberration;
    varying vec2 vUv;

    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 coord = uv - 0.5;
      float dist = length(coord);

      // Chromatic Aberration near screen perimeter
      vec2 caOffset = coord * (dist * uChromaticAberration);
      float r = texture2D(tDiffuse, uv + caOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - caOffset).b;
      vec3 color = vec3(r, g, b);

      // Smooth Vignette
      float vignette = smoothstep(uVignetteOffset, uVignetteOffset - 0.45, dist);
      color *= mix(1.0 - uVignetteDarkness, 1.0, vignette);

      // Organic 35mm Film Grain
      float grain = (rand(uv + sin(uTime * 15.0)) - 0.5) * uGrainIntensity;
      color += grain;

      // Color grade: Deep twilight blue shadows & warm gold highlight lift
      color.r = pow(color.r, 0.98);
      color.g = pow(color.g, 1.0);
      color.b = pow(color.b, 0.95) + 0.012;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Render target with high dynamic range
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);

    // 1. Scene Render Pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // 2. Unreal Bloom Pass (warm glowing god-rays and embers)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.15, // Strength
      0.65, // Radius
      0.28  // Threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Cinematic Vignette + Grain + Chromatic Aberration Pass
    this.cinematicPass = new ShaderPass(CinematicShader);
    this.composer.addPass(this.cinematicPass);

    // 4. Output Pass for correct sRGB tone mapping
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  update(time) {
    if (this.cinematicPass) {
      this.cinematicPass.uniforms.uTime.value = time;
    }
  }

  setBloomIntensity(multiplier) {
    if (this.bloomPass) {
      this.bloomPass.strength = 1.15 * multiplier;
    }
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}

