import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * StoryTimeline
 * Orchestrates narrative text reveals, HUD chapter updates, and WebGL camera & bloom milestones.
 */
export class StoryTimeline {
  constructor(world, soundManager, hud) {
    this.world = world;
    this.soundManager = soundManager;
    this.hud = hud;

    this.chapterNumEl = document.getElementById('chapter-number');
    this.chapterTitleEl = document.getElementById('chapter-title');
    this.progressFillEl = document.getElementById('progress-fill');
    this.progressPercentEl = document.getElementById('progress-percent');

    this.initTimeline();
  }

  initTimeline() {
    // 1. Global Scroll Progress Tracker
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress;

        // Feed to WebGL World
        this.world.setScrollProgress(p);

        // Modulate audio filter based on progress & scroll velocity
        if (this.soundManager) {
          this.soundManager.modulate(p, Math.abs(self.getVelocity() / 1000));
        }

        // Update Bottom HUD Progress Bar
        const percent = Math.round(p * 100);
        if (this.progressPercentEl) {
          this.progressPercentEl.textContent = String(percent).padStart(3, '0');
        }
        if (this.progressFillEl) {
          this.progressFillEl.style.width = `${percent}%`;
        }
      }
    });

    // 2. Individual Chapter Stations
    const sections = document.querySelectorAll('.story-section');

    sections.forEach((section, index) => {
      const chapterCode = section.getAttribute('data-chapter');
      const chapterTitle = section.getAttribute('data-title');

      ScrollTrigger.create({
        trigger: section,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => {
          section.classList.add('active');
          this.updateChapter(chapterCode, chapterTitle, index);
          this.triggerChapterBloom();
        },
        onEnterBack: () => {
          section.classList.add('active');
          this.updateChapter(chapterCode, chapterTitle, index);
        },
        onLeave: () => {
          section.classList.remove('active');
        },
        onLeaveBack: () => {
          section.classList.remove('active');
        }
      });
    });
  }

  updateChapter(code, title, index) {
    if (this.chapterNumEl) {
      this.chapterNumEl.textContent = code;
    }
    if (this.chapterTitleEl) {
      this.chapterTitleEl.textContent = title;
    }
    if (this.hud) {
      this.hud.updateActiveChapter(index);
    }
  }

  triggerChapterBloom() {
    const obj = { bloom: 2.2 };
    gsap.to(obj, {
      bloom: 1.0,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => {
        this.world.setBloomMultiplier(obj.bloom);
      }
    });
  }
}
