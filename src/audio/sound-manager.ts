/**
 * Self-contained Web Audio API Sound Manager.
 * Provides synthesized sound effects and procedural jungle ambient groove.
 * Requires no external network assets and respects browser autoplay policies.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private isInitialized: boolean = false;
  private isPlayingMusic: boolean = false;
  private beatStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  /**
   * Initializes or resumes the AudioContext on deliberate user gesture.
   */
  public async initAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          console.warn('Web Audio API not supported in this browser.');
          return false;
        }
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
      return false;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, now);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  /**
   * Play Jump sound (rising pitch tone).
   */
  public playJump(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {
      console.warn('Failed to play jump sound', e);
    }
  }

  /**
   * Play Slide sound (whoosh noise).
   */
  public playSlide(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Failed to play slide sound', e);
    }
  }

  /**
   * Play Lane Switch sound (subtle swish).
   */
  public playLaneSwitch(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      console.warn('Failed to play lane switch sound', e);
    }
  }

  /**
   * Play Coin Collect sound (bright chime).
   */
  public playCoin(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.setValueAtTime(1975.53, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {
      console.warn('Failed to play coin sound', e);
    }
  }

  /**
   * Play Crash / Game Over sound (low impact thud with noise).
   */
  public playCrash(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) {
      console.warn('Failed to play crash sound', e);
    }
  }

  /**
   * Play UI button click.
   */
  public playClick(): void {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Failed to play click sound', e);
    }
  }

  /**
   * Starts ambient jungle drum/percussion groove loop.
   */
  public startMusic(): void {
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.beatStep = 0;

    const playBeat = () => {
      if (!this.isPlayingMusic || !this.ctx || !this.musicGain || this.isMuted) {
        return;
      }

      try {
        const now = this.ctx.currentTime;
        const step = this.beatStep % 8;

        // Jungle tom/drum pattern on steps 0, 2, 4, 6
        if (step === 0 || step === 4) {
          // Low tom
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(95, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 0.19);
        } else if (step === 2 || step === 6 || step === 7) {
          // Mid / high jungle drum
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          const freq = step === 2 ? 160 : (step === 6 ? 190 : 140);
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 0.15);
        }

        // Shaker / wood tap on every odd step
        if (step % 2 === 1) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800 + (step * 80), now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 0.06);
        }

        this.beatStep++;
      } catch (e) {
        console.warn('Music loop error:', e);
      }
    };

    // ~135 BPM (around 220ms per 8th note)
    this.musicTimer = window.setInterval(playBeat, 222);
  }

  public stopMusic(): void {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (e) {
        console.warn('Error closing AudioContext', e);
      }
    }
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isInitialized = false;
  }
}

export const soundManager = new SoundManager();
