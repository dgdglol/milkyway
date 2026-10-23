// Web Audio API procedural cosmic ambient sound & sound effects generator
// Completely self-contained: no external files or network requests needed!

class SpaceAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];
    this.filter = null;
    this.lfo = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Filter for warm cosmic drone
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(4.0, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // LFO for slow breathing space ambiance
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12.5s cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Cosmic chord frequencies: C2 (65.41), G2 (98.00), C3 (130.81), E3 (164.81), G3 (196.00), B3 (246.94)
    const baseFreqs = [65.41, 98.00, 130.81, 164.81, 196.00];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune for rich celestial chorus
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, this.ctx.currentTime);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.18 / (idx + 1), this.ctx.currentTime);

      // Stereo panner for spatial depth
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime((idx / (baseFreqs.length - 1)) * 1.6 - 0.8, this.ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(panner);
        panner.connect(this.filter);
      } else {
        osc.connect(oscGain);
        oscGain.connect(this.filter);
      }

      osc.start();
      this.oscillators.push(osc);
    });

    this.isPlaying = true;
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;

    if (this.masterGain) {
      const now = this.ctx.currentTime;
      if (this.isMuted) {
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      } else {
        this.masterGain.gain.linearRampToValueAtTime(0.65, now + 1.8);
        this.playPingSound(880, 0.4);
      }
    }

    return !this.isMuted;
  }

  // Warp sound when flying to landmarks
  playWarpSound() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(300, now + 2.0);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(60, now + 2.0);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Crystalline chime on marker click or preset selection
  playPingSound(freq = 784, duration = 0.8) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (e) {
      console.warn('Ping audio error:', e);
    }
  }
}

export const spaceAudio = new SpaceAudioEngine();
