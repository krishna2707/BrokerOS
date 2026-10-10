import { VoiceIntegrationsController } from './voice-integrations.controller.js';

describe('VoiceIntegrationsController', () => {
  let controller: VoiceIntegrationsController;
  let mockIntegrationsService: any;

  beforeEach(() => {
    mockIntegrationsService = {
      getTelephonyIntegrations: jest.fn().mockResolvedValue([{ id: 'tel-1' }]),
      connectTelephony: jest.fn().mockResolvedValue({ id: 'tel-1' }),
      deleteTelephony: jest.fn().mockResolvedValue({ id: 'tel-1' }),
      verifyTelephony: jest.fn().mockResolvedValue({ verified: true }),
      getAgentIntegrations: jest.fn().mockResolvedValue([{ id: 'agent-1' }]),
      connectAgent: jest.fn().mockResolvedValue({ id: 'agent-1' }),
      deleteAgent: jest.fn().mockResolvedValue({ id: 'agent-1' }),
      verifyAgent: jest.fn().mockResolvedValue({ verified: true }),
      getVapiPhoneNumbers: jest.fn().mockResolvedValue(['+123456789']),
      getRemoteAssistants: jest.fn().mockResolvedValue([{ id: 'asst-1' }]),
      createRemoteAssistant: jest.fn().mockResolvedValue({ id: 'asst-new' }),
      updateRemoteAssistant: jest
        .fn()
        .mockResolvedValue({ id: 'asst-1', updated: true }),
      deleteRemoteAssistant: jest.fn().mockResolvedValue({ success: true }),
      getPlatformCatalog: jest
        .fn()
        .mockResolvedValue({ platform: 'VAPI', models: [], voices: [] }),
      prisma: {
        voiceAgentIntegration: {
          findUnique: jest.fn(),
        },
      },
    };

    controller = new VoiceIntegrationsController(mockIntegrationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllIntegrations', () => {
    it('should return telephony and agent integrations', async () => {
      const res = await controller.getAllIntegrations();
      expect(res.telephony.length).toBe(1);
      expect(res.agents.length).toBe(1);
    });
  });

  describe('Telephony endpoints', () => {
    it('should get, connect, delete, and verify telephony', async () => {
      await controller.getTelephonyIntegrations();
      expect(
        mockIntegrationsService.getTelephonyIntegrations,
      ).toHaveBeenCalled();

      const dto: any = { provider: 'TWILIO' };
      await controller.connectTelephony(dto);
      expect(mockIntegrationsService.connectTelephony).toHaveBeenCalledWith(
        dto,
      );

      await controller.verifyTelephony('tel-1');
      expect(mockIntegrationsService.verifyTelephony).toHaveBeenCalledWith(
        'tel-1',
      );

      await controller.deleteTelephony('tel-1');
      expect(mockIntegrationsService.deleteTelephony).toHaveBeenCalledWith(
        'tel-1',
      );
    });
  });

  describe('AI Agent endpoints', () => {
    it('should get, connect, delete, and verify agents', async () => {
      await controller.getAgentIntegrations();
      expect(mockIntegrationsService.getAgentIntegrations).toHaveBeenCalled();

      const dto: any = { platform: 'VAPI' };
      await controller.connectAgent(dto);
      expect(mockIntegrationsService.connectAgent).toHaveBeenCalledWith(dto);

      await controller.verifyAgent('agent-1');
      expect(mockIntegrationsService.verifyAgent).toHaveBeenCalledWith(
        'agent-1',
      );

      await controller.deleteAgent('agent-1');
      expect(mockIntegrationsService.deleteAgent).toHaveBeenCalledWith(
        'agent-1',
      );
    });
  });

  describe('Remote Assistant Management', () => {
    it('should manage remote assistants and phone numbers', async () => {
      await controller.getVapiPhoneNumbers('agent-1');
      expect(mockIntegrationsService.getVapiPhoneNumbers).toHaveBeenCalledWith(
        'agent-1',
      );

      await controller.getRemoteAssistants('agent-1');
      expect(mockIntegrationsService.getRemoteAssistants).toHaveBeenCalledWith(
        'agent-1',
      );

      await controller.createRemoteAssistant('agent-1', {
        name: 'New Assistant',
      });
      expect(
        mockIntegrationsService.createRemoteAssistant,
      ).toHaveBeenCalledWith('agent-1', { name: 'New Assistant' });

      await controller.updateRemoteAssistant('agent-1', 'asst-1', {
        model: 'gpt-4o',
      });
      expect(
        mockIntegrationsService.updateRemoteAssistant,
      ).toHaveBeenCalledWith('agent-1', 'asst-1', { model: 'gpt-4o' });

      await controller.deleteRemoteAssistant('agent-1', 'asst-1');
      expect(
        mockIntegrationsService.deleteRemoteAssistant,
      ).toHaveBeenCalledWith('agent-1', 'asst-1');
    });
  });

  describe('Catalog endpoints', () => {
    it('should get platform catalog by name', async () => {
      const res = await controller.getPlatformCatalog('RETELL');
      expect(mockIntegrationsService.getPlatformCatalog).toHaveBeenCalledWith(
        'RETELL',
      );
      expect(res.platform).toBe('VAPI');
    });

    it('should get agent integration catalog if found', async () => {
      mockIntegrationsService.prisma.voiceAgentIntegration.findUnique.mockResolvedValue(
        {
          id: 'agent-1',
          platform: 'SARVAM',
        },
      );

      await controller.getAgentIntegrationCatalog('agent-1');
      expect(mockIntegrationsService.getPlatformCatalog).toHaveBeenCalledWith(
        'SARVAM',
        'agent-1',
      );
    });

    it('should return empty catalog if agent integration not found', async () => {
      mockIntegrationsService.prisma.voiceAgentIntegration.findUnique.mockResolvedValue(
        null,
      );

      const res = await controller.getAgentIntegrationCatalog('invalid-id');
      expect(res.platform).toBe('VAPI');
      expect(res.models).toEqual([]);
      expect(res.voices).toEqual([]);
    });
  });
});
