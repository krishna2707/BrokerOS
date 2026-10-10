import { VoiceAudioTranscoder } from './voice-audio-transcoder.js';

describe('VoiceAudioTranscoder', () => {
  it('should encode PCM16 to μ-law and decode μ-law back to PCM16', () => {
    // Create a 16-bit PCM buffer (e.g. 100 samples)
    const pcm = Buffer.alloc(200);
    for (let i = 0; i < 100; i++) {
      // Sine wave sample between -10000 and +10000
      const sample = Math.round(10000 * Math.sin((i / 100) * 2 * Math.PI));
      pcm.writeInt16LE(sample, i * 2);
    }

    const ulaw = VoiceAudioTranscoder.pcm16ToUlaw(pcm);
    expect(ulaw.length).toBe(100);

    const decodedPcm = VoiceAudioTranscoder.ulawToPcm16(ulaw);
    expect(decodedPcm.length).toBe(200);

    // G.711 is lossy 8-bit companding, verify roundtrip has high correlation / low error
    let maxDiff = 0;
    for (let i = 0; i < 100; i++) {
      const orig = pcm.readInt16LE(i * 2);
      const dec = decodedPcm.readInt16LE(i * 2);
      const diff = Math.abs(orig - dec);
      if (diff > maxDiff) maxDiff = diff;
    }
    // μ-law quant noise typically under 500 for amplitude 10000
    expect(maxDiff).toBeLessThan(1000);
  });

  it('should convert PCM16 to base64 μ-law and vice versa', () => {
    const pcm = Buffer.alloc(40);
    pcm.writeInt16LE(5000, 0);

    const base64 = VoiceAudioTranscoder.pcm16ToBase64Ulaw(pcm);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);

    const decodedPcm = VoiceAudioTranscoder.base64UlawToPcm16(base64);
    expect(decodedPcm.length).toBe(40);
  });
});
