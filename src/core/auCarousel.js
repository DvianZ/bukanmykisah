/**
 * Instagram AU Carousel Controller
 * Features smooth Desktop Mouse Drag + Mobile Touch Drag,
 * keyboard arrows, dot indicators, and real-time drag feedback.
 */
export class AUCarousel {
  constructor(totalSlides, onSlideChange) {
    this.wrapper = document.querySelector('.ig-carousel-wrapper');
    this.track = document.getElementById('carousel-track');
    this.slides = document.querySelectorAll('.au-slide');
    this.dots = document.querySelectorAll('.ig-dot');
    this.counterEl = document.getElementById('slide-counter');
    this.prevBtn = document.getElementById('btn-prev-slide');
    this.nextBtn = document.getElementById('btn-next-slide');

    this.totalSlides = this.slides.length || totalSlides || 24;
    this.currentSlide = 0;
    this.onSlideChange = onSlideChange;

    // Drag states
    this.isDragging = false;
    this.startX = 0;
    this.currentDragX = 0;
    this.deltaX = 0;

    this.init();
  }

  init() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
      });
    }

    // Dot navigation
    this.dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goTo(idx);
      });
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      }
    });

    // Bind Drag & Swipe (Mouse + Touch)
    this.bindDragEvents();

    this.updateUI();
  }

  bindDragEvents() {
    if (!this.wrapper || !this.track) return;

    // --- MOUSE DRAG ---
    this.wrapper.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons
      if (e.target.closest('button, .ig-audio-fab')) return;

      this.isDragging = true;
      this.startX = e.clientX;
      this.deltaX = 0;
      this.track.style.transition = 'none';
      this.wrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.currentDragX = e.clientX;
      this.deltaX = this.currentDragX - this.startX;

      // Real-time drag follow with resistance at ends
      let resistanceDelta = this.deltaX;
      if (
        (this.currentSlide === 0 && this.deltaX > 0) ||
        (this.currentSlide === this.totalSlides - 1 && this.deltaX < 0)
      ) {
        resistanceDelta = this.deltaX * 0.3;
      }

      this.track.style.transform = `translateX(calc(-${this.currentSlide * 100}% + ${resistanceDelta}px))`;
    });

    window.addEventListener('mouseup', () => {
      if (!this.isDragging) return;
      this.endDrag();
    });

    // --- TOUCH DRAG ---
    this.wrapper.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, .ig-audio-fab')) return;

      this.isDragging = true;
      this.startX = e.touches[0].clientX;
      this.deltaX = 0;
      this.track.style.transition = 'none';
    }, { passive: true });

    this.wrapper.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      this.currentDragX = e.touches[0].clientX;
      this.deltaX = this.currentDragX - this.startX;

      let resistanceDelta = this.deltaX;
      if (
        (this.currentSlide === 0 && this.deltaX > 0) ||
        (this.currentSlide === this.totalSlides - 1 && this.deltaX < 0)
      ) {
        resistanceDelta = this.deltaX * 0.3;
      }

      this.track.style.transform = `translateX(calc(-${this.currentSlide * 100}% + ${resistanceDelta}px))`;
    }, { passive: true });

    this.wrapper.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      this.endDrag();
    });
  }

  endDrag() {
    this.isDragging = false;
    this.wrapper.style.cursor = '';
    this.track.style.transition = 'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1)';

    const threshold = 45; // drag threshold in pixels
    if (this.deltaX < -threshold && this.currentSlide < this.totalSlides - 1) {
      this.next();
    } else if (this.deltaX > threshold && this.currentSlide > 0) {
      this.prev();
    } else {
      // Spring back to current slide
      this.goTo(this.currentSlide);
    }

    this.deltaX = 0;
  }

  next() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.goTo(this.currentSlide + 1);
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.goTo(this.currentSlide - 1);
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.totalSlides) {
      this.currentSlide = index;
      this.updateUI();
      if (this.onSlideChange) {
        this.onSlideChange(this.currentSlide, this.totalSlides);
      }
    }
  }

  updateUI() {
    if (this.track) {
      this.track.style.transition = 'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1)';
      this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }

    this.slides.forEach((slide, idx) => {
      if (idx === this.currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    this.dots.forEach((dot, idx) => {
      if (idx === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (this.counterEl) {
      this.counterEl.textContent = `${this.currentSlide + 1}/${this.totalSlides}`;
    }

    if (this.prevBtn) {
      this.prevBtn.style.opacity = this.currentSlide === 0 ? '0.15' : '0.45';
      this.prevBtn.style.pointerEvents = this.currentSlide === 0 ? 'none' : 'auto';
    }
    if (this.nextBtn) {
      this.nextBtn.style.opacity = this.currentSlide === this.totalSlides - 1 ? '0.15' : '0.45';
      this.nextBtn.style.pointerEvents = this.currentSlide === this.totalSlides - 1 ? 'none' : 'auto';
    }
  }
}
