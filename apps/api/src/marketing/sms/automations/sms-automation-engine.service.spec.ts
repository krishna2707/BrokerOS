jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));
jest.mock('@brokeros/constants', () => ({
  calculateSmsSegments: jest.fn().mockReturnValue({ segments: 1 }),
}));

import { SmsAutomationEngineService } from './sms-automation-engine.service.js';

describe('SmsAutomationEngineService', () => {
  let service: SmsAutomationEngineService;
  let mockPrisma: any;
  let mockIntegrationsService: any;
  let mockAiService: any;
  let mockAudienceService: any;
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = {
      sendBatch: jest.fn().mockResolvedValue({
        success: true,
        sentCount: 1,
        results: [{ recipientId: 'r1', status: 'DELIVERED', messageId: 'm1' }],
      }),
    };

    mockIntegrationsService = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    mockAiService = {
      generateAutoreply: jest.fn().mockResolvedValue({
        text: 'Hello, 2BHK units start at ₹85 Lakhs.',
        modelUsed: 'openai/gpt-oss-120b',
      }),
    };

    mockAudienceService = {
      promoteCsvRecipientToLead: jest.fn(),
    };

    mockPrisma = {
      smsFlow: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      smsFlowRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      smsIntegration: {
        findFirst: jest.fn(),
      },
      smsRecipient: {
        update: jest.fn().mockResolvedValue({}),
      },
      smsTag: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      smsMessage: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'm1' }),
      },
      lead: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    service = new SmsAutomationEngineService(
      mockPrisma,
      mockIntegrationsService,
      mockAiService,
      mockAudienceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processInboundReply', () => {
    it('should return trigger not matched when keyword condition fails', async () => {
      mockPrisma.smsFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          name: 'Pricing Bot',
          status: 'active',
          isGlobal: true,
          triggerType: 'keyword_match',
          triggerConfig: { keywords: ['price', 'cost'], matchMode: 'contains' },
          nodes: [],
        },
      ]);

      const res = await service.processInboundReply({
        fromPhone: '+919876543210',
        toPhone: '+1234567890',
        body: 'Just checking your office location',
        provider: 'TWILIO',
      });

      expect(res.triggerMatched).toBe(false);
      expect(res.actionsExecuted[0]).toContain('Trigger not matched');
    });

    it('should execute linear graph with send_sms and add_tag nodes', async () => {
      const mockFlow = {
        id: 'flow-1',
        name: 'Auto Brochure Flow',
        status: 'active',
        isGlobal: true,
        triggerType: 'keyword_match',
        triggerConfig: { keywords: ['brochure'], matchMode: 'contains' },
        nodes: [
          {
            id: 'n1',
            nodeKey: 'start',
            nodeType: 'start',
            config: {},
          },
          {
            id: 'n2',
            nodeKey: 'reply_sms',
            nodeType: 'send_sms',
            config: {
              body: 'Here is the brochure link: {{project.brochureUrl}}',
            },
          },
          {
            id: 'n3',
            nodeKey: 'tag_lead',
            nodeType: 'add_tag',
            config: {
              tags: ['Brochure Requested'],
            },
          },
        ],
      };

      mockPrisma.smsFlow.findMany.mockResolvedValue([mockFlow]);

      const res = await service.processInboundReply({
        fromPhone: '+919876543210',
        toPhone: '+1234567890',
        body: 'Please send brochure',
        provider: 'TWILIO',
      });

      expect(res.triggerMatched).toBe(true);
      expect(mockAdapter.sendBatch).toHaveBeenCalled();
      expect(
        res.actionsExecuted.some((a) => a.includes('Sent SMS reply')),
      ).toBe(true);
    });

    it('should execute ai_reply node using SmsAiService', async () => {
      const mockFlow = {
        id: 'flow-ai',
        name: 'AI Agent SMS Concierge',
        status: 'active',
        isGlobal: true,
        triggerType: 'any_reply',
        nodes: [
          {
            id: 'n1',
            nodeKey: 'start',
            nodeType: 'start',
            config: {},
          },
          {
            id: 'n2',
            nodeKey: 'ai_concierge',
            nodeType: 'ai_reply',
            config: {
              systemPrompt: 'Assist with prices',
            },
          },
        ],
      };

      mockPrisma.smsFlow.findMany.mockResolvedValue([mockFlow]);

      const res = await service.processInboundReply({
        fromPhone: '+919876543210',
        toPhone: '+1234567890',
        body: 'What is the price of 2BHK?',
        provider: 'TWILIO',
      });

      expect(res.triggerMatched).toBe(true);
      expect(mockAiService.generateAutoreply).toHaveBeenCalled();
      expect(mockAdapter.sendBatch).toHaveBeenCalled();
      expect(res.actionsExecuted.some((a) => a.includes('AI Concierge'))).toBe(
        true,
      );
    });

    it('should handle simulated inbound reply without DB persistence', async () => {
      mockPrisma.smsFlow.findUnique.mockResolvedValue({
        id: 'flow-sim',
        name: 'Simulated Flow',
        triggerType: 'keyword_match',
        triggerConfig: { keywords: ['info'] },
        nodes: [
          { id: 'n1', nodeKey: 'start', nodeType: 'start', config: {} },
          {
            id: 'n2',
            nodeKey: 'sms1',
            nodeType: 'send_sms',
            config: { body: 'Test info' },
          },
        ],
      });

      const res = await service.processInboundReply({
        fromPhone: '+919876543210',
        toPhone: '+1234567890',
        body: 'info',
        provider: 'SIMULATOR',
        forceFlowId: 'flow-sim',
        isSimulation: true,
      });

      expect(res.triggerMatched).toBe(true);
      expect(mockPrisma.smsFlowRun.create).not.toHaveBeenCalled();
      expect(mockAdapter.sendBatch).not.toHaveBeenCalled();
    });
  });
});
