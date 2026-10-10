jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { VoiceTestController } from './voice-test.controller.js';

describe('VoiceTestController', () => {
  let controller: VoiceTestController;
  let mockVoiceService: any;

  beforeEach(() => {
    mockVoiceService = {
      testCarrierLine: jest
        .fn()
        .mockResolvedValue({ success: true, callId: 'c-1' }),
      testVoiceAiCall: jest
        .fn()
        .mockResolvedValue({ success: true, providerCallId: 'a-1' }),
    };

    controller = new VoiceTestController(mockVoiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('testCarrier', () => {
    it('should delegate to voiceService.testCarrierLine', async () => {
      const dto: any = {
        carrier: 'TWILIO',
        destinationNumber: '+919876543210',
      };
      const res = await controller.testCarrier(dto);
      expect(mockVoiceService.testCarrierLine).toHaveBeenCalledWith(dto);
      expect(res.callId).toBe('c-1');
    });
  });

  describe('testVoiceAiCall', () => {
    it('should delegate to voiceService.testVoiceAiCall', async () => {
      const dto: any = { platform: 'VAPI', targetPhone: '+919876543210' };
      const res = await controller.testVoiceAiCall(dto);
      expect(mockVoiceService.testVoiceAiCall).toHaveBeenCalledWith(dto);
      expect(res.providerCallId).toBe('a-1');
    });
  });
});
