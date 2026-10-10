jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { WhatsAppFlowEngineService } from './whatsapp-flow-engine.service.js';

describe('WhatsAppFlowEngineService', () => {
  let service: WhatsAppFlowEngineService;
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
      whatsAppFlowRun: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      whatsAppFlow: {
        findMany: jest.fn(),
      },
      whatsAppFlowNode: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new WhatsAppFlowEngineService(
      mockConfigService,
      mockRealtimeGateway,
    );
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatchInboundToFlows', () => {
    it('should return handled false if no active run and no trigger matches', async () => {
      mockPrisma.whatsAppFlowRun.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppFlow.findMany.mockResolvedValue([]);

      const res = await service.dispatchInboundToFlows({
        accountId: 'acc-1',
        contactId: 'c-1',
        conversationId: 'conv-1',
        message: { kind: 'text', text: 'Random message' },
      });

      expect(res.handled).toBe(false);
    });

    it('should trigger and start new flow run if keyword matches', async () => {
      mockPrisma.whatsAppFlowRun.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          triggerType: 'keyword',
          triggerConfig: { keywords: ['brochure'], match_type: 'contains' },
        },
      ]);

      const startSpy = jest
        .spyOn(service, 'startFlowRun')
        .mockResolvedValue({ id: 'run-new' });

      const res = await service.dispatchInboundToFlows({
        accountId: 'acc-1',
        contactId: 'c-1',
        conversationId: 'conv-1',
        message: { kind: 'text', text: 'Please send the brochure' },
      });

      expect(res.handled).toBe(true);
      expect(res.runId).toBe('run-new');
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('handleAgentPreemption', () => {
    it('should pause active flow run when agent intervenes', async () => {
      mockPrisma.whatsAppFlowRun.findFirst.mockResolvedValue({
        id: 'run-active',
        status: 'active',
      });
      mockPrisma.whatsAppFlowRun.update.mockResolvedValue({ id: 'run-active' });

      await service.handleAgentPreemption('conv-1');

      expect(mockPrisma.whatsAppFlowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'run-active' },
          data: expect.objectContaining({
            status: 'paused_by_agent',
            endReason: 'agent_intervened',
          }),
        }),
      );
    });
  });
});
