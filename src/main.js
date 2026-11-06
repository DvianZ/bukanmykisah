import * as THREE from 'three';
import { World } from './webgl/world.js';
import { AUCarousel } from './core/auCarousel.js';
import { SoundManager } from './audio/soundManager.js';
import { IGInteractions } from './ui/igInteractions.js';

/**
 * Main Application Bootstrap
 * Instagram AU Theme (10 Zero-Scroll Slides with Drag & Touch)
 */
class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.clock = new THREE.Clock();
    this.isLoaded = false;

    this.init();
  }

  async init() {
    // 1. Initialize Audio Manager
    this.soundManager = new SoundManager((isPlaying) => {
      if (this.igInteractions) {
        this.igInteractions.updateAudioState(isPlaying);
      }
    });

    // 2. Initialize Instagram Interactions (Likes, Bookmark, Speaker Audio Button)
    this.igInteractions = new IGInteractions(this.soundManager);

    // 3. Initialize Vivid 3D WebGL Background
    this.world = new World(this.canvas);

    // 4. Initialize Instagram Carousel with 24 zero-scroll slides
    this.carousel = new AUCarousel(24, (currentSlide, totalSlides) => {
      const progress = currentSlide / (totalSlides - 1);
      this.world.setScrollProgress(progress);
      this.world.setBloomMultiplier(1.85);

      this.soundManager.modulate(progress, 0.4);
      this.soundManager.playChime();
    });

    // 5. Run Preloader (fake scenario / kpn yh)
    await this.runPreloader();

    // 6. Start Unified Render Loop
    this.startLoop();

    // 7. Bind Cleanup
    window.addEventListener('beforeunload', () => this.dispose());
  }

  runPreloader() {
    return new Promise((resolve) => {
      const bar = document.getElementById('preloader-bar');
      const percentEl = document.getElementById('preloader-percent');
      const preloader = document.getElementById('preloader');

      let current = 0;
      const interval = setInterval(() => {
        // Durasi tenang, berkesan, dan sinematik (~4.5 hingga 5 detik)
        let step = 1;
        if (current < 35) {
          step = Math.random() < 0.5 ? 1 : 2;
        } else if (current < 70) {
          step = Math.random() < 0.7 ? 1 : 2;
        } else if (current < 95) {
          step = Math.random() < 0.6 ? 1 : 2;
        } else {
          step = 1;
        }

        current = Math.min(100, current + step);

        if (bar) bar.style.width = `${current}%`;
        if (percentEl) percentEl.textContent = `${current}%`;

        if (current >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            if (preloader) preloader.classList.add('fade-out');
            document.body.classList.remove('loading');
            this.isLoaded = true;
            resolve();
          }, 950);
        }
      }, 55);
    });
  }

  startLoop() {
    const loop = () => {
      requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.05);

      this.world.update(delta);
      this.world.render();
    };

    requestAnimationFrame(loop);
  }

  dispose() {
    if (this.world) this.world.dispose();
  }
}

// Instantiate on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
