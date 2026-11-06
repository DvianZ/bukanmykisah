/**
 * HUD, In-World 3D Beacons & Interactive Drawer Controller
 */
export class HUD {
  constructor(soundManager, onRailClick) {
    this.soundManager = soundManager;
    this.onRailClick = onRailClick;

    // Top HUD
    this.soundToggleBtn = document.getElementById('sound-toggle');
    this.soundLabel = document.getElementById('sound-label');
    this.soundWaveBars = document.querySelectorAll('.sound-waves .wave-bar');
    this.clockEl = document.getElementById('hud-clock');
    this.audioPromptPill = document.getElementById('audio-prompt-pill');

    // Right Rail
    this.railIndicator = document.getElementById('rail-indicator');
    this.railItems = document.querySelectorAll('.rail-item');

    // In-world Beacons Layer
    this.beaconsLayer = document.getElementById('beacons-layer');
    this.beaconElements = [];

    // Memory Drawer elements
    this.drawer = document.getElementById('memory-drawer');
    this.drawerBackdrop = document.getElementById('drawer-backdrop');
    this.drawerCloseBtn = document.getElementById('drawer-close');
    this.drawerTitle = document.getElementById('drawer-title');
    this.drawerTimestamp = document.getElementById('drawer-timestamp');
    this.drawerTag = document.getElementById('drawer-tag');
    this.drawerBody = document.getElementById('drawer-body');
    this.drawerCode = document.getElementById('drawer-code');

    this.initAudioUI();
    this.initClock();
    this.initRail();
    this.initDrawer();
  }

  initAudioUI() {
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        this.soundManager.toggle();
      });
    }

    if (this.audioPromptPill) {
      this.audioPromptPill.addEventListener('click', () => {
        this.soundManager.toggle();
        this.audioPromptPill.classList.add('hidden');
      });
    }
  }

  updateAudioState(isPlaying) {
    if (this.soundToggleBtn) {
      if (isPlaying) {
        this.soundToggleBtn.classList.add('playing');
        if (this.soundLabel) this.soundLabel.textContent = 'SOUND [ON]';
        if (this.audioPromptPill) this.audioPromptPill.classList.add('hidden');
      } else {
        this.soundToggleBtn.classList.remove('playing');
        if (this.soundLabel) this.soundLabel.textContent = 'SOUND [OFF]';
        this.soundWaveBars.forEach((bar) => {
          bar.style.height = '4px';
        });
      }
    }
  }

  updateVisualizer() {
    if (this.soundManager && this.soundManager.isPlaying) {
      const freq = this.soundManager.getFrequencyData();
      if (freq && this.soundWaveBars.length > 0) {
        this.soundWaveBars.forEach((bar, idx) => {
          const val = freq[idx * 2] || 0;
          const h = 4 + (val / 255) * 12;
          bar.style.height = `${h}px`;
        });
      }
    }
  }

  initClock() {
    if (!this.clockEl) return;
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      this.clockEl.textContent = `${hrs}:${mins} ${ampm}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  initRail() {
    this.railItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        if (this.onRailClick) {
          this.onRailClick(index);
        }
      });
    });
  }

  updateActiveChapter(index) {
    this.railItems.forEach((item, idx) => {
      if (idx === Number(index)) {
        item.classList.add('active');
        if (this.railIndicator) {
          const itemTop = item.offsetTop;
          this.railIndicator.style.top = `${itemTop}px`;
        }
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Update 2D In-World Beacon Pills tracking 3D Shards
   */
  updateBeacons(shardPositions) {
    if (!this.beaconsLayer) return;

    if (this.beaconElements.length !== shardPositions.length) {
      this.beaconsLayer.innerHTML = '';
      this.beaconElements = shardPositions.map((shard) => {
        const el = document.createElement('div');
        el.className = 'beacon-pill';
        el.innerHTML = `
          <span class="pulse-point amber"></span>
          <span>✦ BENDA KENANGAN // BUKA</span>
        `;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.soundManager.playChime();
          this.openMemoryDrawer(shard.memory);
        });
        this.beaconsLayer.appendChild(el);
        return el;
      });
    }

    shardPositions.forEach((shard, idx) => {
      const el = this.beaconElements[idx];
      if (!el) return;

      if (shard.visible) {
        el.style.display = 'inline-flex';
        el.style.left = `${shard.x}px`;
        el.style.top = `${shard.y}px`;
      } else {
        el.style.display = 'none';
      }
    });
  }

  initDrawer() {
    if (this.drawerCloseBtn) {
      this.drawerCloseBtn.addEventListener('click', () => this.closeDrawer());
    }
    if (this.drawerBackdrop) {
      this.drawerBackdrop.addEventListener('click', () => this.closeDrawer());
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawer && this.drawer.classList.contains('open')) {
        this.closeDrawer();
      }
    });
  }

  openMemoryDrawer(memory) {
    if (!this.drawer) return;

    if (this.drawerTitle) this.drawerTitle.textContent = memory.title;
    if (this.drawerTimestamp) this.drawerTimestamp.textContent = memory.timestamp;
    if (this.drawerTag) this.drawerTag.textContent = memory.tag;
    if (this.drawerBody) this.drawerBody.textContent = memory.text;
    if (this.drawerCode) this.drawerCode.textContent = memory.code;

    this.soundManager.playChime();
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
  }
}
