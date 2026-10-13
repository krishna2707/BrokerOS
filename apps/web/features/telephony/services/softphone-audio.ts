// ============================================================================
// BrokerOS - WebRTC Browser Softphone Audio Engine
// Handles microphone access, audio analysis, volume metering, & audio feedback
// ============================================================================

export class SoftphoneAudioEngine {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;

  /**
   * Initializes browser microphone with echo cancellation and noise suppression.
   */
  async startMicrophone(onVolumeChange?: (volume: number) => void): Promise<MediaStream> {
    if (typeof window === "undefined" || !navigator?.mediaDevices) {
      throw new Error("Microphone access is not supported in this browser environment.");
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    if (onVolumeChange) {
      this.startVolumeMeter(this.mediaStream, onVolumeChange);
    }

    return this.mediaStream;
  }

  /**
   * Sets mute state for the microphone audio track.
   */
  setMuted(muted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Starts real-time volume level analysis (0 to 100).
   */
  private startVolumeMeter(stream: MediaStream, callback: (volume: number) => void) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;

      source.connect(this.analyser);
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const volume = Math.min(100, Math.round((average / 128) * 100));

        callback(volume);
        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("[SoftphoneAudioEngine] Volume metering not available:", e);
    }
  }

  /**
   * Synthesizes standard telecom ringback tone using Web Audio API.
   */
  startRingbackTone() {
    try {
      if (this.ringOscillator) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard 440 Hz
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.ringOscillator = osc;
      this.ringGain = gain;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Stops synthesized ringback tone when call connects.
   */
  stopRingbackTone() {
    try {
      if (this.ringOscillator) {
        this.ringOscillator.stop();
        this.ringOscillator.disconnect();
        this.ringOscillator = null;
      }
      if (this.ringGain) {
        this.ringGain.disconnect();
        this.ringGain = null;
      }
    } catch {
      // Cleanup fallback
    }
  }

  /**
   * Releases all audio resources and stops microphone tracks.
   */
  stop() {
    this.stopRingbackTone();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyser = null;
  }
}
