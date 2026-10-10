jest.mock('./tts/elevenlabs-tts.js', () => ({
  synthesizeElevenLabs: jest.fn(),
}));

jest.mock('./tts/sarvam-tts.js', () => ({
  synthesizeSarvam: jest.fn(),
}));

jest.mock('./tts/deepgram-tts.js', () => ({
  synthesizeDeepgram: jest.fn(),
}));

jest.mock('./tts/cartesia-tts.js', () => ({
  synthesizeCartesia: jest.fn(),
}));

jest.mock('./tts/openai-tts.js', () => ({
  synthesizeOpenAi: jest.fn(),
}));

jest.mock('@brokeros/int-voice', () => ({
  getVoiceAgentProvider: jest.fn().mockReturnValue({
    previewAudio: jest.fn().mockResolvedValue({
      audioBuffer: Buffer.alloc(1000), // > 500 bytes
      contentType: 'audio/mpeg',
    }),
  }),
}));

import { VoiceAudioService } from './voice-audio.service.js';
import { synthesizeElevenLabs } from './tts/elevenlabs-tts.js';
import { synthesizeSarvam } from './tts/sarvam-tts.js';

describe('VoiceAudioService', () => {
  let service: VoiceAudioService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      voiceAgentIntegration: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    service = new VoiceAudioService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('previewTtsAudio', () => {
    it('should synthesize audio using Sarvam when voice is Sarvam speaker', async () => {
      process.env.SARVAM_API_KEY = 'sarvam-key-1';
      const expectedBuffer = {
        audioBuffer: Buffer.from('sarvam-audio'),
        contentType: 'audio/wav',
      };
      (synthesizeSarvam as jest.Mock).mockResolvedValue(expectedBuffer);

      const res = await service.previewTtsAudio({
        text: 'Namaste',
        voiceId: 'meera',
        voiceProvider: 'sarvam',
      });

      expect(synthesizeSarvam).toHaveBeenCalledWith(
        'Namaste',
        'meera',
        'sarvam-key-1',
      );
      expect(res).toEqual(expectedBuffer);
    });

    it('should synthesize audio using ElevenLabs when voice is ElevenLabs voice', async () => {
      process.env.ELEVENLABS_API_KEY = 'eleven-key-1';
      const expectedBuffer = {
        audioBuffer: Buffer.from('eleven-audio'),
        contentType: 'audio/mpeg',
      };
      (synthesizeElevenLabs as jest.Mock).mockResolvedValue(expectedBuffer);

      const res = await service.previewTtsAudio({
        text: 'Hello world',
        voiceId: '11labs-rachel',
      });

      expect(synthesizeElevenLabs).toHaveBeenCalled();
      expect(res).toEqual(expectedBuffer);
    });

    it('should fallback to provider previewAudio if direct TTS is not matched', async () => {
      // Clear env vars
      delete process.env.SARVAM_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;
      delete process.env.DEEPGRAM_API_KEY;
      delete process.env.CARTESIA_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const res = await service.previewTtsAudio({
        text: 'Testing fallback',
        voiceId: 'generic-voice',
      });

      expect(res.audioBuffer.length).toBe(1000);
      expect(res.contentType).toBe('audio/mpeg');
    });
  });
});
