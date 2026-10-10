jest.mock('@brokeros/int-voice', () => ({
  getVoiceTelephonyProvider: jest.fn().mockReturnValue({
    testCarrierCall: jest
      .fn()
      .mockResolvedValue({ success: true, callId: 'carrier-call-1' }),
  }),
  getVoiceAgentProvider: jest.fn().mockReturnValue({
    dispatchOutboundCall: jest
      .fn()
      .mockResolvedValue({ success: true, providerCallId: 'agent-call-1' }),
  }),
  tryCarrierBridgeDispatch: jest.fn().mockResolvedValue({
    handled: true,
    result: { success: true, providerCallId: 'bridge-call-1' },
  }),
}));

import { NotFoundException } from '@nestjs/common';
import { VoiceDispatcherService } from './voice-dispatcher.service.js';

describe('VoiceDispatcherService', () => {
  let service: VoiceDispatcherService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      voiceTelephonyIntegration: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      voiceAgentIntegration: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
    };

    service = new VoiceDispatcherService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testCarrierLine', () => {
    it('should throw NotFoundException if telephony gateway not found', async () => {
      mockPrisma.voiceTelephonyIntegration.findUnique.mockResolvedValue(null);

      await expect(
        service.testCarrierLine({
          telephonyId: 'tel-none',
          toPhone: '+919876543210',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should test carrier line and return result', async () => {
      mockPrisma.voiceTelephonyIntegration.findUnique.mockResolvedValue({
        id: 'tel-1',
        provider: 'TWILIO',
        accountSid: 'AC123',
        authToken: 'token123',
        fromNumbers: ['+14155550199'],
      });

      const res = await service.testCarrierLine({
        telephonyId: 'tel-1',
        toPhone: '+919876543210',
      });

      expect(res.success).toBe(true);
      expect(res.callId).toBe('carrier-call-1');
    });
  });

  describe('testVoiceAiCall', () => {
    it('should throw NotFoundException if no telephony configured in non-direct mode', async () => {
      mockPrisma.voiceTelephonyIntegration.findUnique.mockResolvedValue(null);
      mockPrisma.voiceTelephonyIntegration.findFirst.mockResolvedValue(null);

      await expect(
        service.testVoiceAiCall({
          toPhone: '+919876543210',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should dispatch via direct agent mode when testMode is vapi-direct', async () => {
      mockPrisma.voiceAgentIntegration.findFirst.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'vapi-key',
      });

      const res = await service.testVoiceAiCall({
        toPhone: '+919876543210',
        testMode: 'vapi-direct',
        scriptPrompt: 'Hello {{prospect_name}}',
      } as any);

      expect(res.success).toBe(true);
      expect(res.providerCallId).toBe('agent-call-1');
    });

    it('should dispatch via carrier bridge in standard mode', async () => {
      mockPrisma.voiceTelephonyIntegration.findFirst.mockResolvedValue({
        id: 'tel-1',
        provider: 'VOBIZ',
        apiKey: 'vobiz-key',
        fromNumbers: ['+911140005000'],
      });
      mockPrisma.voiceAgentIntegration.findFirst.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'vapi-key',
      });

      const res = await service.testVoiceAiCall({
        toPhone: '+919876543210',
        scriptPrompt: 'Greetings from BrokerOS',
      } as any);

      expect(res.success).toBe(true);
      expect(res.providerCallId).toBe('bridge-call-1');
    });
  });
});
