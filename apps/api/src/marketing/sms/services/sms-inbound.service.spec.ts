jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));
jest.mock('@brokeros/constants', () => ({
  calculateSmsSegments: jest.fn().mockReturnValue({ segments: 1 }),
}));

import { SmsInboundService } from './sms-inbound.service.js';

describe('SmsInboundService', () => {
  let service: SmsInboundService;
  let mockPrisma: any;
  let mockAutomationEngine: any;
  let mockAiService: any;

  beforeEach(() => {
    mockPrisma = {
      smsRecipient: {
        findFirst: jest.fn(),
      },
      smsInboundMessage: {
        create: jest.fn(),
      },
      smsConversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      smsIntegration: {
        findFirst: jest.fn(),
      },
      smsMessage: {
        create: jest.fn(),
      },
    };

    mockAutomationEngine = {
      processInboundReply: jest
        .fn()
        .mockResolvedValue({ actionsExecuted: ['Sent reply'] }),
    };

    mockAiService = {
      draftSmsReply: jest.fn(),
    };

    service = new SmsInboundService(
      mockPrisma,
      mockAutomationEngine,
      mockAiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleInboundSms', () => {
    it('should process inbound SMS, resolve recipient, audit message, and sync to conversation', async () => {
      mockPrisma.smsRecipient.findFirst.mockResolvedValue({
        id: 'rec-1',
        name: 'Amit Verma',
        phone: '+919876543210',
        campaignId: 'camp-1',
        leadId: 'lead-1',
        lead: { firstName: 'Amit', lastName: 'Verma' },
      });
      mockPrisma.smsInboundMessage.create.mockResolvedValue({
        id: 'inbound-1',
      });
      mockPrisma.smsConversation.findFirst.mockResolvedValue(null);
      mockPrisma.smsConversation.create.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.smsMessage.create.mockResolvedValue({ id: 'msg-1' });

      const res = await service.handleInboundSms({
        from: '+91 98765 43210',
        to: '+1234567890',
        text: 'Interested in 3BHK pricing',
        provider: 'TWILIO',
        messageId: 'tw-123',
      });

      expect(res.success).toBe(true);
      expect(res.matchedRecipientId).toBe('rec-1');
      expect(mockPrisma.smsInboundMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromPhone: '+919876543210',
            toPhone: '+1234567890',
            status: 'PROCESSED',
          }),
        }),
      );
      expect(mockPrisma.smsConversation.create).toHaveBeenCalled();
      expect(mockPrisma.smsMessage.create).toHaveBeenCalled();
      expect(mockAutomationEngine.processInboundReply).toHaveBeenCalled();
    });

    it('should handle unlinked recipient gracefully', async () => {
      mockPrisma.smsRecipient.findFirst.mockResolvedValue(null);
      mockPrisma.smsInboundMessage.create.mockResolvedValue({
        id: 'inbound-2',
      });
      mockPrisma.smsConversation.findFirst.mockResolvedValue(null);
      mockPrisma.smsIntegration.findFirst.mockResolvedValue(null);
      mockPrisma.smsConversation.create.mockResolvedValue({ id: 'conv-2' });
      mockPrisma.smsMessage.create.mockResolvedValue({ id: 'msg-2' });

      const res = await service.handleInboundSms({
        from: '+919999999999',
        to: '+1000000000',
        text: 'Hello who is this',
      });

      expect(res.success).toBe(true);
      expect(res.matchedRecipientId).toBeNull();
      expect(mockPrisma.smsInboundMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UNMATCHED',
          }),
        }),
      );
    });
  });

  describe('simulateInboundReply', () => {
    it('should run simulation with forced flow ID without creating DB records', async () => {
      mockPrisma.smsRecipient.findFirst.mockResolvedValue({
        id: 'rec-1',
        phone: '+919876543210',
      });

      const res = await service.simulateInboundReply({
        leadPhone: '+919876543210',
        senderPhone: '+1234567890',
        bodyText: 'Price please',
        flowId: 'flow-sim-1',
      });

      expect(res.simulation).toBe(true);
      expect(mockAutomationEngine.processInboundReply).toHaveBeenCalledWith(
        expect.objectContaining({
          isSimulation: true,
          forceFlowId: 'flow-sim-1',
        }),
      );
      expect(mockPrisma.smsInboundMessage.create).not.toHaveBeenCalled();
    });
  });
});
