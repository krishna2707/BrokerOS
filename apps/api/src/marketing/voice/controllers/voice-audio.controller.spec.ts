jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { VoiceAudioController } from './voice-audio.controller.js';

describe('VoiceAudioController', () => {
  let controller: VoiceAudioController;
  let mockAudioService: any;
  let mockRes: any;

  beforeEach(() => {
    mockAudioService = {
      previewTtsAudio: jest.fn(),
    };

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new VoiceAudioController(mockAudioService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('previewAudio', () => {
    it('should synthesize audio preview and send buffer with headers', async () => {
      const buffer = Buffer.from('mock-wav-audio');
      mockAudioService.previewTtsAudio.mockResolvedValue({
        contentType: 'audio/wav',
        audioBuffer: buffer,
      });

      const dto: any = {
        text: 'Hello world',
        provider: 'ELEVENLABS',
        voiceId: 'voice-1',
      };

      await controller.previewAudio(dto, mockRes);

      expect(mockAudioService.previewTtsAudio).toHaveBeenCalledWith(dto);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'audio/wav',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        buffer.length.toString(),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(buffer);
    });

    it('should catch error and return 500 status', async () => {
      mockAudioService.previewTtsAudio.mockRejectedValue(
        new Error('TTS provider quota exceeded'),
      );

      const dto: any = { text: 'Fail' };

      await controller.previewAudio(dto, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'TTS provider quota exceeded',
        }),
      );
    });
  });
});
