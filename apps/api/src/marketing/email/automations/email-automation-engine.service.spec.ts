jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { EmailAutomationEngineService } from './email-automation-engine.service.js';

describe('EmailAutomationEngineService', () => {
  let service: EmailAutomationEngineService;
  let mockPrisma: any;
  let mockIntegrationsService: any;
  let mockAiService: any;
  let mockAudienceService: any;
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = {
      sendBatch: jest.fn().mockResolvedValue({ success: true }),
    };

    mockIntegrationsService = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    mockAiService = {
      generateAutoreply: jest.fn().mockResolvedValue({
        subject: 'Re: Price Inquiry',
        textBody: 'Here are the current starting rates.',
        htmlBody: '<p>Here are the current starting rates.</p>',
      }),
    };

    mockAudienceService = {
      promoteCsvRecipientToLead: jest
        .fn()
        .mockResolvedValue({ id: 'promoted-lead-1' }),
    };

    mockPrisma = {
      emailFlow: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      emailFlowRun: {
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn().mockResolvedValue({ id: 'run-1' }),
      },
      emailTag: {
        upsert: jest.fn().mockResolvedValue({ id: 'tag-1' }),
      },
      lead: {
        update: jest.fn().mockResolvedValue({ id: 'lead-1' }),
      },
    };

    service = new EmailAutomationEngineService(
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
      mockPrisma.emailFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          name: 'Pricing Inquiries',
          status: 'active',
          isGlobal: true,
          triggerType: 'keyword_match',
          triggerConfig: { keywords: ['price', 'cost'], matchMode: 'contains' },
          nodes: [],
        },
      ]);

      const result = await service.processInboundReply({
        fromEmail: 'user@example.com',
        toEmail: 'sales@skyline.com',
        subject: 'Hello',
        body: 'Just checking if you are open on weekends',
        provider: 'AWS_SES',
      });

      expect(result.triggerMatched).toBe(false);
      expect(result.actionsExecuted[0]).toContain('Trigger not matched');
    });

    it('should execute linear graph with send_email and add_tag nodes', async () => {
      const mockFlow = {
        id: 'flow-1',
        name: 'Auto Response Flow',
        status: 'active',
        isGlobal: true,
        triggerType: 'keyword_match',
        triggerConfig: { keywords: ['brochure'], matchMode: 'contains' },
        nodes: [
          {
            nodeKey: 'start',
            nodeType: 'start',
            config: { next_node_key: 'node_reply' },
          },
          {
            nodeKey: 'node_reply',
            nodeType: 'send_email',
            config: {
              subject: 'Your Brochure for {{project_name}}',
              textBody: 'Hi {{lead_name}}, please find the brochure attached.',
              next_node_key: 'node_tag',
            },
          },
          {
            nodeKey: 'node_tag',
            nodeType: 'add_tag',
            config: {
              tagName: 'Brochure-Requested',
              color: '#10B981',
              next_node_key: 'node_end',
            },
          },
          {
            nodeKey: 'node_end',
            nodeType: 'end',
            config: {},
          },
        ],
      };

      mockPrisma.emailFlow.findMany.mockResolvedValue([mockFlow]);

      const result = await service.processInboundReply({
        fromEmail: 'client@example.com',
        toEmail: 'sales@skyline.com',
        subject: 'Please send brochure',
        body: 'Can I get the brochure for Skyline Residences?',
        provider: 'AWS_SES',
        recipient: {
          id: 'rec-1',
          email: 'client@example.com',
          name: 'Karan',
          assignedProvider: 'AWS_SES',
          assignedSenderEmail: 'sales@skyline.com',
          campaign: { title: 'Skyline Launch' },
        },
      });

      expect(result.triggerMatched).toBe(true);
      expect(mockAdapter.sendBatch).toHaveBeenCalled();
      expect(mockPrisma.emailTag.upsert).toHaveBeenCalledWith({
        where: { name: 'Brochure-Requested' },
        create: { name: 'Brochure-Requested', color: '#10B981' },
        update: {},
      });
      expect(mockPrisma.emailFlowRun.create).toHaveBeenCalled();
      expect(mockPrisma.emailFlowRun.update).toHaveBeenCalled();
      expect(result.actionsExecuted).toHaveLength(3);
    });

    it('should execute ai_reply node with AI concierge', async () => {
      const mockFlow = {
        id: 'flow-ai',
        name: 'AI Agent Inbound',
        status: 'active',
        isGlobal: true,
        triggerType: 'any_reply',
        nodes: [
          {
            nodeKey: 'ai_step',
            nodeType: 'ai_reply',
            config: {
              instructions: 'Always mention free parking',
            },
          },
        ],
      };

      mockPrisma.emailFlow.findMany.mockResolvedValue([mockFlow]);

      const result = await service.processInboundReply({
        fromEmail: 'client@example.com',
        toEmail: 'sales@skyline.com',
        subject: 'General questions',
        body: 'What are the amenities?',
        provider: 'AWS_SES',
      });

      expect(mockAiService.generateAutoreply).toHaveBeenCalled();
      expect(result.outboundReply).toBe('Here are the current starting rates.');
    });

    it('should evaluate conditional branching on budget or keyword', async () => {
      const mockFlow = {
        id: 'flow-cond',
        name: 'VIP Qualification Flow',
        status: 'active',
        isGlobal: true,
        triggerType: 'any_reply',
        nodes: [
          {
            nodeKey: 'cond_node',
            nodeType: 'condition',
            config: {
              criteriaType: 'budget',
              minBudget: 10000000,
              branches: {
                yes: [
                  {
                    nodeType: 'send_email',
                    config: {
                      subject: 'VIP Penthouse Invitation',
                      textBody:
                        'Exclusive invitation for high net worth buyer.',
                    },
                  },
                ],
                no: [
                  {
                    nodeType: 'send_email',
                    config: {
                      subject: 'Standard Brochure',
                      textBody: 'Here is our brochure.',
                    },
                  },
                ],
              },
            },
          },
        ],
      };

      mockPrisma.emailFlow.findMany.mockResolvedValue([mockFlow]);

      // Case 1: High budget -> YES branch
      const resultYes = await service.processInboundReply({
        fromEmail: 'vip@example.com',
        toEmail: 'sales@skyline.com',
        subject: 'Looking for luxury',
        body: 'Show me your best units',
        provider: 'AWS_SES',
        recipient: {
          email: 'vip@example.com',
          lead: { budget: 15000000 },
        },
      });

      expect(
        resultYes.actionsExecuted.some((a) =>
          a.includes('VIP Penthouse Invitation'),
        ),
      ).toBe(true);
    });

    it('should handle simulated inbound reply without writing to DB', async () => {
      const mockFlow = {
        id: 'flow-sim',
        name: 'Simulation Flow',
        nodes: [
          {
            nodeKey: 'n1',
            nodeType: 'send_email',
            config: { subject: 'Simulated Reply', textBody: 'Simulation body' },
          },
        ],
      };

      mockPrisma.emailFlow.findUnique.mockResolvedValue(mockFlow);

      const result = await service.processInboundReply({
        fromEmail: 'sim@example.com',
        toEmail: 'sales@skyline.com',
        subject: 'Simulated inquiry',
        body: 'Pricing?',
        provider: 'SIMULATOR',
        forceFlowId: 'flow-sim',
        isSimulation: true,
      });

      expect(mockPrisma.emailFlowRun.create).not.toHaveBeenCalled();
      expect(mockAdapter.sendBatch).not.toHaveBeenCalled();
      expect(result.renderedSubject).toBe('Simulated Reply');
      expect(result.renderedBody).toBe('Simulation body');
    });
  });
});
