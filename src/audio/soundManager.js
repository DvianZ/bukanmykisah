import { Howl } from 'howler';

/**
 * SoundManager
 * Dual-Mode Audio Engine featuring procedural ambient synth,
 * interactive crystalline chimes, and real-time FFT frequency analysis.
 */
export class SoundManager {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.isPlaying = false;
    this.audioCtx = null;
    this.masterGain = null;
    this.filter = null;
    this.analyser = null;
    this.oscillators = [];
    this.noiseNode = null;

    this.frequencyData = new Uint8Array(16);
  }

  initWebAudio() {
    if (this.audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);

    // Dynamic Lowpass Filter
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(750, this.audioCtx.currentTime);
    this.filter.Q.setValueAtTime(2.2, this.audioCtx.currentTime);

    // FFT Frequency Analyser for HUD wave visualizer
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 32;
    this.analyser.smoothingTimeConstant = 0.85;

    // Routing: Synths -> Filter -> MasterGain -> Analyser -> Destination
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.createAmbientSynthPads();
    this.createTapeHissNoise();
  }

  createAmbientSynthPads() {
    // Evolving D minor 9 / A minor 9 harmonic chord frequencies (Hz)
    const notes = [
      { freq: 73.41, type: 'sine', detune: 0, gain: 0.28 },
      { freq: 110.00, type: 'triangle', detune: -4, gain: 0.18 },
      { freq: 174.61, type: 'sine', detune: 6, gain: 0.22 },
      { freq: 261.63, type: 'triangle', detune: -8, gain: 0.15 },
      { freq: 329.63, type: 'sine', detune: 5, gain: 0.12 },
      { freq: 440.00, type: 'sine', detune: -3, gain: 0.08 }
    ];

    notes.forEach((note) => {
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, this.audioCtx.currentTime);
      osc.detune.setValueAtTime(note.detune, this.audioCtx.currentTime);

      noteGain.gain.setValueAtTime(note.gain, this.audioCtx.currentTime);

      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.08 + Math.random() * 0.05, this.audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(4.0, this.audioCtx.currentTime);

      lfo.connect(osc.detune);
      lfo.start();

      osc.connect(noteGain);
      noteGain.connect(this.filter);

      osc.start();
      this.oscillators.push(osc);
    });
  }

  createTapeHissNoise() {
    const bufferSize = this.audioCtx.sampleRate * 3;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.025;
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    noiseFilter.Q.setValueAtTime(0.8, this.audioCtx.currentTime);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start();
    this.noiseNode = noiseSource;
  }

  /**
   * Play procedural crystalline harmonic chime on memory shard click
   */
  playChime() {
    this.initWebAudio();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const chimeFreqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    const randomFreq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(randomFreq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.9);
  }

  toggle() {
    this.initWebAudio();

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.fadeTo(0.0001, 1.0, () => {
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
      });
    } else {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
      this.fadeTo(0.48, 1.8);
    }
  }

  fadeTo(targetVal, duration, callback) {
    if (!this.masterGain || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(targetVal, 0.0001), now + duration);

    if (callback) {
      setTimeout(callback, duration * 1000);
    }
  }

  modulate(progress, velocity = 0) {
    if (!this.filter || !this.audioCtx || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;

    const baseFreq = 700 + progress * 1600;
    const velBoost = Math.min(velocity * 400, 1000);
    const targetFreq = Math.min(baseFreq + velBoost, 4200);

    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.2);
  }

  getFrequencyData() {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }
}
