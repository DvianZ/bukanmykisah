import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroller
 * Buttery smooth physics-based inertia scrolling powered by Lenis + GSAP synchronization.
 */
export class Scroller {
  constructor(onScrollCallback) {
    this.onScrollCallback = onScrollCallback;
    this.initLenis();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false
    });

    // Synchronize Lenis scroll updates with GSAP ScrollTrigger
    this.lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      if (this.onScrollCallback) {
        this.onScrollCallback(e);
      }
    });

    // Drive Lenis RAF inside GSAP ticker for frame-perfect lock
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  scrollTo(target, options = {}) {
    this.lenis.scrollTo(target, options);
  }

  stop() {
    this.lenis.stop();
  }

  start() {
    this.lenis.start();
  }

  destroy() {
    this.lenis.destroy();
  }
}

