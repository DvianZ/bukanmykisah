/**
 * Instagram AU Interactions with Realtime Firebase Database
 * Unique Devices Counter, Total Pageviews, Global Likes, Double-Tap Like, Audio Toggle, and Stats Modal
 * Endpoint: https://bukanmykisah-default-rtdb.asia-southeast1.firebasedatabase.app/story_stats.json
 */

const FIREBASE_ENDPOINT = 'https://bukanmykisah-default-rtdb.asia-southeast1.firebasedatabase.app/story_stats.json';

export class IGInteractions {
  constructor(soundManager) {
    this.soundManager = soundManager;

    // Elements
    this.likeBtn = document.getElementById('btn-like');
    this.likeCountEl = document.getElementById('like-count');
    this.bookmarkBtn = document.getElementById('btn-bookmark');
    this.shareBtn = document.getElementById('btn-share');
    this.audioBtn = document.getElementById('ig-audio-btn');
    this.moreOptionsBtn = document.getElementById('btn-more-options');

    // Modal elements
    this.modal = document.getElementById('stats-modal');
    this.modalDevicesEl = document.getElementById('modal-devices-count');
    this.modalViewsEl = document.getElementById('modal-views-count');
    this.modalLikesEl = document.getElementById('modal-likes-count');
    this.btnRefreshStats = document.getElementById('btn-refresh-stats');
    this.btnCopyLink = document.getElementById('btn-copy-link');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.toastEl = document.getElementById('toast-notify');
    this.toastMsgEl = document.getElementById('toast-message');

    // States
    this.isLiked = localStorage.getItem('au_user_liked') === 'true';
    this.isBookmarked = false;
    this.uniqueDevices = 1;
    this.totalViews = 1;
    this.likeCount = 0;
    this.isLoadingStats = false;

    this.init();
  }

  async init() {
    // Reflect saved like state in UI
    if (this.isLiked && this.likeBtn) {
      this.likeBtn.classList.add('liked');
    }

    this.initEvents();
    await this.syncVisitorAndStats();
  }

  getDeviceId() {
    let id = localStorage.getItem('au_device_uuid');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('au_device_uuid', id);
    }
    return id;
  }

  /**
   * Fetch current stats from Firebase Realtime Database
   */
  async fetchLiveStats() {
    try {
      const res = await fetch(FIREBASE_ENDPOINT, { cache: 'no-store' });
      if (!res.ok) throw new Error('Status ' + res.status);
      const data = await res.json();
      const devices = (data && data.devices && typeof data.devices === 'object') ? data.devices : {};
      const deviceCount = Object.keys(devices).length;

      return {
        unique_devices: (data && typeof data.unique_devices === 'number')
          ? data.unique_devices
          : (deviceCount > 0 ? deviceCount : 1),
        total_views: (data && typeof data.total_views === 'number') ? data.total_views : 1,
        likes: (data && typeof data.likes === 'number') ? data.likes : 0,
        devices: devices
      };
    } catch (err) {
      console.warn('Gagal membaca data Firebase (fallback offline):', err);
      return null;
    }
  }

  /**
   * Save stats patch to Firebase Realtime Database
   */
  async patchLiveStats(patchData) {
    try {
      await fetch(FIREBASE_ENDPOINT, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
    } catch (err) {
      console.warn('Gagal memperbarui Firebase:', err);
    }
  }

  /**
   * Register device ID to Firebase
   */
  async registerDevice(deviceId) {
    try {
      await fetch('https://bukanmykisah-default-rtdb.asia-southeast1.firebasedatabase.app/story_stats/devices.json', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [deviceId]: Date.now() })
      });
    } catch (err) {
      console.warn('Gagal mencatat ID device:', err);
    }
  }

  /**
   * Record visitor per unique device and sync counts
   */
  async syncVisitorAndStats() {
    const deviceId = this.getDeviceId();
    const liveStats = await this.fetchLiveStats();

    if (liveStats) {
      this.uniqueDevices = Math.max(liveStats.unique_devices, 1);
      this.totalViews = Math.max(liveStats.total_views, 1);
      this.likeCount = Math.max(liveStats.likes, 0);

      const registeredDevices = liveStats.devices || {};
      const knownCount = Object.keys(registeredDevices).length;
      const isDeviceAlreadyKnown = Boolean(registeredDevices[deviceId]);
      const patchData = {};

      // 1. Cek apakah ini perangkat baru (Device)
      if (!isDeviceAlreadyKnown) {
        // Daftarkan device ini ke Firebase
        this.registerDevice(deviceId);

        if (knownCount === 0) {
          // Jika belum ada device terdaftar di database, jadikan device 1
          this.uniqueDevices = 1;
          patchData.unique_devices = 1;
        } else {
          // Jika perangkat lain baru yang membuka tautan
          this.uniqueDevices = Math.max(liveStats.unique_devices, knownCount) + 1;
          patchData.unique_devices = this.uniqueDevices;
        }
        patchData.visitors = this.uniqueDevices;
      } else {
        // Device sudah pernah tercatat, gunakan data akurat
        this.uniqueDevices = Math.max(liveStats.unique_devices, knownCount);
      }

      // 2. Cek apakah ini sesi kunjungan baru (Berapa kali dilihat)
      const hasCountedSessionView = sessionStorage.getItem('au_session_view_counted');
      if (!hasCountedSessionView) {
        this.totalViews += 1;
        patchData.total_views = this.totalViews;
        sessionStorage.setItem('au_session_view_counted', 'true');
      }

      // Kirim pembaruan ke Firebase jika ada pertambahan
      if (Object.keys(patchData).length > 0) {
        this.patchLiveStats(patchData);
      }
    } else {
      // Fallback penyimpanan lokal jika offline
      const localViews = parseInt(localStorage.getItem('au_local_views') || '1', 10);
      const hasCountedSessionView = sessionStorage.getItem('au_session_view_counted');
      this.totalViews = hasCountedSessionView ? localViews : localViews + 1;
      localStorage.setItem('au_local_views', this.totalViews.toString());
      sessionStorage.setItem('au_session_view_counted', 'true');

      this.uniqueDevices = 1;
      this.likeCount = this.isLiked ? 1 : 0;
    }

    this.updateUI();
  }

  updateUI() {
    if (this.likeCountEl) {
      this.likeCountEl.textContent = this.likeCount.toLocaleString('id-ID');
    }
    if (this.modalDevicesEl) {
      this.modalDevicesEl.textContent = this.uniqueDevices.toLocaleString('id-ID');
    }
    if (this.modalViewsEl) {
      this.modalViewsEl.textContent = this.totalViews.toLocaleString('id-ID');
    }
    if (this.modalLikesEl) {
      this.modalLikesEl.textContent = this.likeCount.toLocaleString('id-ID');
    }
  }

  initEvents() {
    // Like button toggle
    if (this.likeBtn) {
      this.likeBtn.addEventListener('click', () => this.toggleLike());
    }

    // Double-tap on slide track to like
    const track = document.getElementById('carousel-track');
    let lastTap = 0;
    if (track) {
      track.addEventListener('click', (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;
        if (tapLength < 320 && tapLength > 0) {
          this.triggerDoubleTapHeart(e.clientX, e.clientY);
          if (!this.isLiked) {
            this.toggleLike();
          }
          e.preventDefault();
        }
        lastTap = currentTime;
      });
    }

    // Bookmark toggle
    if (this.bookmarkBtn) {
      this.bookmarkBtn.addEventListener('click', () => {
        this.isBookmarked = !this.isBookmarked;
        this.bookmarkBtn.classList.toggle('bookmarked', this.isBookmarked);
        this.soundManager.playChime();
        this.showToast(this.isBookmarked ? 'Disimpan ke koleksi' : 'Dihapus dari koleksi');
      });
    }

    // Share button
    if (this.shareBtn) {
      this.shareBtn.addEventListener('click', () => this.copyStoryLink());
    }

    // Audio button in post corner
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => {
        this.soundManager.toggle();
      });
    }

    // More Options Modal (•••)
    if (this.moreOptionsBtn) {
      this.moreOptionsBtn.addEventListener('click', () => this.openStatsModal());
    }

    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.closeStatsModal());
    }

    if (this.btnRefreshStats) {
      this.btnRefreshStats.addEventListener('click', async () => {
        this.btnRefreshStats.disabled = true;
        this.btnRefreshStats.style.opacity = '0.6';
        await this.syncVisitorAndStats();
        this.showToast('Data statistik berhasil diperbarui');
        this.btnRefreshStats.disabled = false;
        this.btnRefreshStats.style.opacity = '1';
      });
    }

    if (this.btnCopyLink) {
      this.btnCopyLink.addEventListener('click', () => this.copyStoryLink());
    }

    // Close modal on click backdrop
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeStatsModal();
        }
      });
    }

    // Close modal on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('open')) {
        this.closeStatsModal();
      }
    });
  }

  async toggleLike() {
    this.isLiked = !this.isLiked;
    localStorage.setItem('au_user_liked', this.isLiked ? 'true' : 'false');

    if (this.likeBtn) {
      this.likeBtn.classList.toggle('liked', this.isLiked);
    }

    if (this.isLiked) {
      this.likeCount += 1;
      this.soundManager.playChime();
    } else {
      this.likeCount = Math.max(0, this.likeCount - 1);
    }

    this.updateUI();

    // Send update to Firebase
    await this.patchLiveStats({ likes: this.likeCount });
  }

  triggerDoubleTapHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'floating-doubletap-heart';
    heart.innerHTML = '❤️';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 900);
  }

  async openStatsModal() {
    if (!this.modal) return;
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');

    // Fetch freshest data upon opening modal
    const liveStats = await this.fetchLiveStats();
    if (liveStats) {
      this.uniqueDevices = Math.max(liveStats.unique_devices, 1);
      this.totalViews = Math.max(liveStats.total_views, 1);
      this.likeCount = Math.max(liveStats.likes, 0);
      this.updateUI();
    }
  }

  closeStatsModal() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
  }

  copyStoryLink() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => this.showToast('Tautan cerita berhasil disalin!'))
        .catch(() => this.showToast('Gagal menyalin tautan'));
    } else {
      // Fallback execCommand
      const tempInput = document.createElement('input');
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      this.showToast('Tautan cerita berhasil disalin!');
    }
  }

  showToast(message) {
    if (!this.toastEl || !this.toastMsgEl) return;
    this.toastMsgEl.textContent = message;
    this.toastEl.classList.add('show');
    this.toastEl.setAttribute('aria-hidden', 'false');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
      this.toastEl.setAttribute('aria-hidden', 'true');
    }, 2400);
  }

  updateAudioState(isPlaying) {
    if (this.audioBtn) {
      this.audioBtn.classList.toggle('playing', isPlaying);
      const iconMuted = this.audioBtn.querySelector('.icon-muted');
      const iconPlaying = this.audioBtn.querySelector('.icon-playing');

      if (iconMuted && iconPlaying) {
        if (isPlaying) {
          iconMuted.style.display = 'none';
          iconPlaying.style.display = 'block';
        } else {
          iconMuted.style.display = 'block';
          iconPlaying.style.display = 'none';
        }
      }
    }
  }
}
