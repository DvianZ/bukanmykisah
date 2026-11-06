/**
 * Magnetic Fluid Cursor
 * Smooth two-tier cursor (center pinpoint dot + smoothed lagging outer aura).
 */
export class Cursor {
  constructor() {
    this.dot = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');

    this.mouse = { x: -100, y: -100 };
    this.ringPos = { x: -100, y: -100 };

    this.init();
  }

  init() {
    if (!this.dot || !this.ring) return;

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;
    });

    // Hover state detection
    const interactives = document.querySelectorAll('button, a, [data-cursor="hover"]');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => this.ring.classList.add('active'));
      el.addEventListener('mouseleave', () => this.ring.classList.remove('active'));
    });

    this.render();
  }

  render() {
    // Smooth lag interpolation for outer ring
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.18;
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.18;

    this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px)`;

    requestAnimationFrame(() => this.render());
  }
}

