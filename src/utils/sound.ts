// Native Web Audio API Cosmic Ambient Drone Generator
// Generates relaxing deep space brown noise and subtle harmonic resonance for Focus Mode

class CosmicSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private oscNode: OscillatorNode | null = null;
  private oscGain: GainNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(volume: number = 0.25) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.currentVolume = volume;

    // Create 5 seconds of smooth Brown Noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration filter
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Boost amplitude
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Low-pass filter for cosmic deep-space resonance (muffled void)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Subtle 55Hz (A1 note) sub-harmonic celestial drone
    this.oscNode = this.ctx.createOscillator();
    this.oscNode.type = 'sine';
    this.oscNode.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.oscGain = this.ctx.createGain();
    this.oscGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
    // Smooth fade in
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, this.currentVolume), this.ctx.currentTime + 1.2);

    // Route audio graph
    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);

    this.oscNode.connect(this.oscGain);
    this.oscGain.connect(this.gainNode);

    this.gainNode.connect(this.ctx.destination);

    this.noiseNode.start();
    this.oscNode.start();
    this.isPlaying = true;
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.gainNode && this.isPlaying) {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.gainNode) return;
    try {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.noiseNode) {
          try { this.noiseNode.stop(); } catch { /* ignore */ }
          this.noiseNode.disconnect();
          this.noiseNode = null;
        }
        if (this.oscNode) {
          try { this.oscNode.stop(); } catch { /* ignore */ }
          this.oscNode.disconnect();
          this.oscNode = null;
        }
        this.isPlaying = false;
      }, 500);
    } catch {
      this.isPlaying = false;
    }
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const cosmicSound = new CosmicSoundEngine();
