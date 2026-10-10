jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailInboxService } from './email-inbox.service.js';

describe('EmailInboxService', () => {
  let service: EmailInboxService;
  let mockPrisma: any;
  let mockIntegrationsService: any;
  let mockAiService: any;
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = {
      sendBatch: jest.fn().mockResolvedValue({
        success: true,
        providerMessageId: 'msg-out-123',
      }),
    };

    mockIntegrationsService = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    mockAiService = {
      generateAutoreply: jest.fn().mockResolvedValue({
        subject: 'Re: Inquiry',
        textBody: 'AI generated response',
        htmlBody: '<p>AI generated response</p>',
      }),
    };

    mockPrisma = {
      emailConversation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      emailMessage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      marketingIntegration: {
        findFirst: jest.fn(),
      },
      lead: {
        findUnique: jest.fn(),
      },
    };

    service = new EmailInboxService(
      mockPrisma,
      mockIntegrationsService,
      mockAiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listConversations', () => {
    it('should return paginated conversations with filters', async () => {
      mockPrisma.emailConversation.findMany.mockResolvedValue([
        { id: 'conv-1', contactEmail: 'client@example.com' },
      ]);
      mockPrisma.emailConversation.count.mockResolvedValue(1);

      const res = await service.listConversations({
        page: 1,
        limit: 10,
        status: 'open',
        agentId: 'agent-1',
        search: 'client',
      });

      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.totalPages).toBe(1);
    });
  });

  describe('getConversation', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue(null);

      await expect(service.getConversation('conv-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return conversation details if found', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        contactEmail: 'client@example.com',
      });

      const res = await service.getConversation('conv-1');
      expect(res.id).toBe('conv-1');
    });
  });

  describe('getMessages', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue(null);

      await expect(service.getMessages('conv-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return messages for a conversation', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
      });
      mockPrisma.emailMessage.findMany.mockResolvedValue([
        { id: 'msg-1', bodyText: 'Hello' },
      ]);

      const res = await service.getMessages('conv-1');
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });

  describe('startConversation', () => {
    it('should return existing conversation if active one already exists', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);
      mockPrisma.emailConversation.findFirst.mockResolvedValue({
        id: 'conv-exist',
        contactEmail: 'client@example.com',
      });

      const res = await service.startConversation(
        {
          contactEmail: 'client@example.com',
          subject: 'Welcome',
        },
        { id: 'user-1', name: 'Agent' },
      );

      expect(res.id).toBe('conv-exist');
    });

    it('should create new conversation if none exists', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        firstName: 'Aarav',
        lastName: 'Shah',
      });
      mockPrisma.emailConversation.findFirst.mockResolvedValue(null);
      mockPrisma.marketingIntegration.findFirst.mockResolvedValue({
        provider: 'AWS_SES',
        fromEmail: 'sales@skyline.com',
      });
      mockPrisma.emailConversation.create.mockResolvedValue({
        id: 'conv-new',
        contactEmail: 'aarav@example.com',
        contactName: 'Aarav Shah',
      });

      const res = await service.startConversation(
        {
          contactEmail: 'aarav@example.com',
          leadId: 'lead-1',
          subject: 'Property Consultation',
        },
        { id: 'user-1', name: 'Agent' },
      );

      expect(mockPrisma.emailConversation.create).toHaveBeenCalled();
      expect(res.id).toBe('conv-new');
    });
  });

  describe('sendReply', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue(null);

      await expect(
        service.sendReply('conv-none', { text: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if message content is empty', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
      });

      await expect(
        service.sendReply('conv-1', { text: '   ', html: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send email via adapter, store outbound message and update conversation', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        contactEmail: 'client@example.com',
        contactName: 'Client',
        assignedProvider: 'AWS_SES',
        assignedSenderEmail: 'sales@skyline.com',
        subject: 'Price Sheet',
      });
      mockPrisma.emailMessage.findFirst.mockResolvedValue({
        providerMsgId: 'inbound-msg-1',
      });
      mockPrisma.emailMessage.create.mockResolvedValue({
        id: 'msg-out-1',
        bodyText: 'Here is the brochure.',
      });
      mockPrisma.emailConversation.update.mockResolvedValue({});

      const res = await service.sendReply(
        'conv-1',
        { text: 'Here is the brochure.' },
        { id: 'agent-1', name: 'Sales Exec' },
      );

      expect(mockIntegrationsService.getAdapter).toHaveBeenCalledWith(
        'AWS_SES',
      );
      expect(mockAdapter.sendBatch).toHaveBeenCalled();
      expect(mockPrisma.emailMessage.create).toHaveBeenCalled();
      expect(mockPrisma.emailConversation.update).toHaveBeenCalled();
      expect(res.id).toBe('msg-out-1');
    });
  });

  describe('updateStatus, assignAgent, markRead', () => {
    it('should update status', async () => {
      mockPrisma.emailConversation.update.mockResolvedValue({
        id: 'conv-1',
        status: 'closed',
      });

      const res = await service.updateStatus('conv-1', 'closed');
      expect(res.status).toBe('closed');
    });

    it('should assign agent', async () => {
      mockPrisma.emailConversation.update.mockResolvedValue({
        id: 'conv-1',
        agentUserId: 'agent-42',
      });

      const res = await service.assignAgent('conv-1', 'agent-42');
      expect(res.agentUserId).toBe('agent-42');
    });

    it('should mark conversation as read', async () => {
      mockPrisma.emailConversation.update.mockResolvedValue({
        id: 'conv-1',
        unreadCount: 0,
      });

      const res = await service.markRead('conv-1');
      expect(res.unreadCount).toBe(0);
    });
  });

  describe('draftAiReply', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue(null);

      await expect(service.draftAiReply('conv-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should compile message thread and call AI service', async () => {
      mockPrisma.emailConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        contactName: 'Rohit Verma',
        subject: 'Skyline Launch inquiry',
        campaign: { title: 'Skyline Launch' },
        lead: {
          firstName: 'Rohit',
          lastName: 'Verma',
          interestedProject: { name: 'Skyline Crest', city: 'Mumbai' },
        },
      });

      mockPrisma.emailMessage.findMany.mockResolvedValue([
        { direction: 'INBOUND', bodyText: 'Is parking included?' },
      ]);

      const draft = await service.draftAiReply('conv-1', {
        instruction: 'Emphasize covered parking included in price',
      });

      expect(mockAiService.generateAutoreply).toHaveBeenCalled();
      expect(draft.subject).toBe('Re: Inquiry');
      expect(draft.textBody).toBe('AI generated response');
    });
  });
});
