jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { WhatsAppAutomationEngineService } from './whatsapp-automation-engine.service.js';

describe('WhatsAppAutomationEngineService', () => {
  let service: WhatsAppAutomationEngineService;
  let mockPrisma: any;
  let mockConfigService: any;
  let mockRealtimeGateway: any;

  beforeEach(() => {
    mockConfigService = {
      getDecryptedAccount: jest.fn().mockResolvedValue({
        id: 'acc-1',
        phoneNumberId: 'phone-100',
        accessToken: 'token-100',
      }),
    };

    mockRealtimeGateway = {
      emitMessageSent: jest.fn(),
      emitConversationUpdated: jest.fn(),
    };

    mockPrisma = {
      whatsAppContact: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c-1', accountId: 'acc-1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'c-1', phone: '+919876543210' }),
      },
      whatsAppAutomation: {
        findMany: jest.fn(),
      },
      whatsAppAutomationStep: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      whatsAppAutomationLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        update: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findUnique: jest.fn().mockResolvedValue({ stepsExecuted: { steps: [] } }),
      },
      whatsAppAutomationPendingExecution: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      whatsAppConversation: {
        findFirst: jest.fn().mockResolvedValue({ id: 'conv-1' }),
        create: jest.fn(),
      },
    };

    service = new WhatsAppAutomationEngineService(
      mockConfigService,
      mockRealtimeGateway,
    );
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runAutomationsForTrigger', () => {
    it('should ignore if contact does not belong to account', async () => {
      mockPrisma.whatsAppContact.findFirst.mockResolvedValue(null);

      await service.runAutomationsForTrigger(
        'acc-1',
        'first_inbound_message',
        'c-other',
      );

      expect(mockPrisma.whatsAppAutomation.findMany).not.toHaveBeenCalled();
    });

    it('should fetch matching automations and execute', async () => {
      mockPrisma.whatsAppAutomation.findMany.mockResolvedValue([
        {
          id: 'auto-1',
          accountId: 'acc-1',
          triggerType: 'first_inbound_message',
          isActive: true,
        },
      ]);

      const executeSpy = jest.spyOn(service, 'executeAutomation').mockResolvedValue();

      await service.runAutomationsForTrigger(
        'acc-1',
        'first_inbound_message',
        'c-1',
      );

      expect(mockPrisma.whatsAppAutomation.findMany).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalled();
    });
  });

  describe('executeAutomation', () => {
    it('should create audit log and finalize upon execution', async () => {
      const automation = {
        id: 'auto-1',
        accountId: 'acc-1',
        triggerType: 'first_inbound_message',
      };

      await service.executeAutomation(automation, 'c-1');

      expect(mockPrisma.whatsAppAutomationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            automationId: 'auto-1',
            status: 'failed',
          }),
        }),
      );
      expect(mockPrisma.whatsAppAutomationLog.update).toHaveBeenCalled();
    });
  });
});
