jest.mock('@brokeros/int-voice', () => ({
  getVoiceTelephonyProvider: jest.fn().mockReturnValue({
    validateCredentials: jest.fn().mockResolvedValue(true),
  }),
  getVoiceAgentProvider: jest.fn().mockReturnValue({
    validateCredentials: jest.fn().mockResolvedValue(true),
    getAvailableModels: jest.fn().mockResolvedValue(['gpt-4o']),
    getAvailableVoices: jest.fn().mockResolvedValue(['rachel']),
    getAccountAssistants: jest.fn().mockResolvedValue([{ id: 'asst-1' }]),
    createRemoteAssistant: jest.fn().mockResolvedValue({ id: 'asst-new' }),
    updateRemoteAssistant: jest
      .fn()
      .mockResolvedValue({ id: 'asst-1', updated: true }),
    deleteRemoteAssistant: jest.fn().mockResolvedValue(true),
  }),
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VoiceIntegrationsService } from './voice-integrations.service.js';

describe('VoiceIntegrationsService', () => {
  let service: VoiceIntegrationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      voiceTelephonyIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      voiceAgentIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      voiceCampaign: {
        updateMany: jest.fn(),
      },
    };

    service = new VoiceIntegrationsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Telephony Integrations', () => {
    it('should list telephony integrations with cleaned fromNumbers', async () => {
      mockPrisma.voiceTelephonyIntegration.findMany.mockResolvedValue([
        { id: 'tel-1', fromNumbers: [' +911140005000 ', '+911140005000'] },
      ]);

      const res = await service.getTelephonyIntegrations();
      expect(res.length).toBe(1);
      expect(res[0].fromNumbers).toEqual(['+911140005000']);
    });

    it('should connect telephony integration after validation', async () => {
      mockPrisma.voiceTelephonyIntegration.create.mockResolvedValue({
        id: 'tel-new',
      });

      const res = await service.connectTelephony({
        provider: 'TWILIO',
        name: 'Twilio Gateway',
        accountSid: 'AC123',
        authToken: 'token123',
        fromNumbers: ['+14155550199'],
        isDefault: true,
      });

      expect(
        mockPrisma.voiceTelephonyIntegration.updateMany,
      ).toHaveBeenCalledWith({
        data: { isDefault: false },
      });
      expect(mockPrisma.voiceTelephonyIntegration.create).toHaveBeenCalled();
      expect(res.id).toBe('tel-new');
    });

    it('should verify telephony gateway credentials and return latency', async () => {
      mockPrisma.voiceTelephonyIntegration.findUnique.mockResolvedValue({
        id: 'tel-1',
        provider: 'TWILIO',
        fromNumbers: ['+14155550199'],
      });

      const res = await service.verifyTelephony('tel-1');
      expect(res.isValid).toBe(true);
      expect(res.fromNumbersCount).toBe(1);
    });

    it('should delete telephony gateway and unbind campaigns', async () => {
      mockPrisma.voiceCampaign.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.voiceTelephonyIntegration.delete.mockResolvedValue({
        id: 'tel-1',
      });

      const res = await service.deleteTelephony('tel-1');
      expect(mockPrisma.voiceCampaign.updateMany).toHaveBeenCalledWith({
        where: { telephonyId: 'tel-1' },
        data: { telephonyId: null },
      });
      expect(res.id).toBe('tel-1');
    });
  });

  describe('AI Agent Integrations', () => {
    it('should list agent integrations', async () => {
      mockPrisma.voiceAgentIntegration.findMany.mockResolvedValue([
        { id: 'agent-1' },
      ]);

      const res = await service.getAgentIntegrations();
      expect(res.length).toBe(1);
    });

    it('should connect AI agent integration after validation', async () => {
      mockPrisma.voiceAgentIntegration.create.mockResolvedValue({
        id: 'agent-new',
      });

      const res = await service.connectAgent({
        platform: 'VAPI',
        name: 'Vapi Primary',
        apiKey: 'vapi-key-1',
        isDefault: true,
      });

      expect(mockPrisma.voiceAgentIntegration.updateMany).toHaveBeenCalledWith({
        data: { isDefault: false },
      });
      expect(res.id).toBe('agent-new');
    });

    it('should verify agent integration', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'key-1',
      });

      const res = await service.verifyAgent('agent-1');
      expect(res.isValid).toBe(true);
      expect(res.platform).toBe('VAPI');
    });

    it('should delete agent integration and unbind campaigns', async () => {
      mockPrisma.voiceCampaign.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.voiceAgentIntegration.delete.mockResolvedValue({
        id: 'agent-1',
      });

      const res = await service.deleteAgent('agent-1');
      expect(mockPrisma.voiceCampaign.updateMany).toHaveBeenCalledWith({
        where: { agentPlatformId: 'agent-1' },
        data: { agentPlatformId: null },
      });
      expect(res.id).toBe('agent-1');
    });
  });

  describe('Catalog & Remote Assistant Management', () => {
    it('should get platform catalog with models, voices, assistants', async () => {
      const res = await service.getPlatformCatalog('VAPI');
      expect(res.platform).toBe('VAPI');
      expect(res.models).toContain('gpt-4o');
      expect(res.voices).toContain('rachel');
      expect(res.assistants.length).toBe(1);
    });

    it('should get remote assistants for integration', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'key',
      });

      const res = await service.getRemoteAssistants('agent-1');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('asst-1');
    });

    it('should create remote assistant', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'key',
      });

      const res = await service.createRemoteAssistant('agent-1', {
        name: 'Demo Bot',
      });
      expect(res.id).toBe('asst-new');
    });

    it('should update remote assistant', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'key',
      });

      const res = await service.updateRemoteAssistant('agent-1', 'asst-1', {
        model: 'gpt-4o',
      });
      expect(res.updated).toBe(true);
    });

    it('should delete remote assistant', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
        platform: 'VAPI',
        apiKey: 'key',
      });

      const res = await service.deleteRemoteAssistant('agent-1', 'asst-1');
      expect(res.success).toBe(true);
    });
  });
});
