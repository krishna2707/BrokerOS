jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));
jest.mock('@brokeros/constants', () => ({
  calculateSmsSegments: jest.fn().mockReturnValue({ segments: 1 }),
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SmsInboxService } from './sms-inbox.service.js';

describe('SmsInboxService', () => {
  let service: SmsInboxService;
  let mockPrisma: any;
  let mockIntegrationsService: any;
  let mockAiService: any;
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = {
      sendBatch: jest.fn().mockResolvedValue({
        success: true,
        sentCount: 1,
        results: [
          { recipientId: 'r1', status: 'DELIVERED', messageId: 'msg-out-123' },
        ],
      }),
    };

    mockIntegrationsService = {
      getAdapter: jest.fn().mockReturnValue(mockAdapter),
    };

    mockAiService = {
      generateAutoreply: jest.fn().mockResolvedValue({
        text: 'Hi, we have 2BHK starting from 85L.',
        modelUsed: 'llama-3.3-70b-versatile',
      }),
    };

    mockPrisma = {
      smsConversation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      smsMessage: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      smsIntegration: {
        findFirst: jest.fn(),
      },
    };

    service = new SmsInboxService(
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
      mockPrisma.smsConversation.findMany.mockResolvedValue([
        { id: 'conv-1', contactPhone: '+919876543210', status: 'open' },
      ]);
      mockPrisma.smsConversation.count.mockResolvedValue(1);

      const res = await service.listConversations({
        status: 'open',
        page: 1,
        limit: 10,
      });
      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(mockPrisma.smsConversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
        }),
      );
    });
  });

  describe('getConversation', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue(null);
      await expect(service.getConversation('c-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return conversation if found', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({ id: 'c-1' });
      const res = await service.getConversation('c-1');
      expect(res.id).toBe('c-1');
    });
  });

  describe('startConversation', () => {
    it('should return existing conversation if active one already exists', async () => {
      mockPrisma.smsConversation.findFirst.mockResolvedValue({
        id: 'c-existing',
      });
      mockPrisma.smsConversation.findUnique.mockResolvedValue({
        id: 'c-existing',
        contactPhone: '+919876543210',
        assignedProvider: 'TWILIO',
        assignedSenderPhone: '+1234567890',
        lead: null,
      });
      mockPrisma.smsIntegration.findFirst.mockResolvedValue({
        apiKey: 'test-key',
        authToken: 'test-auth',
        provider: 'TWILIO',
        senderNumbers: [{ phoneNumber: '+1234567890', isVerified: true }],
      });
      mockPrisma.smsMessage.create.mockResolvedValue({ id: 'm-1' });
      mockPrisma.smsConversation.update.mockResolvedValue({});

      const res = await service.startConversation({
        contactPhone: '+919876543210',
        initialMessage: 'Hello there',
      });
      expect(res.id).toBe('c-existing');
      expect(mockPrisma.smsConversation.create).not.toHaveBeenCalled();
    });

    it('should create new conversation if none exists', async () => {
      mockPrisma.smsConversation.findFirst.mockResolvedValue(null);
      mockPrisma.smsIntegration.findFirst.mockResolvedValue({
        apiKey: 'test-key',
        authToken: 'test-auth',
        provider: 'TWILIO',
        senderNumbers: [{ phoneNumber: '+1234567890', isVerified: true }],
      });
      mockPrisma.smsConversation.create.mockResolvedValue({
        id: 'c-new',
        assignedProvider: 'TWILIO',
        assignedSenderPhone: '+1234567890',
      });
      mockPrisma.smsConversation.findUnique.mockResolvedValue({
        id: 'c-new',
        contactPhone: '+919876543210',
        assignedProvider: 'TWILIO',
        assignedSenderPhone: '+1234567890',
        lead: null,
      });
      mockPrisma.smsMessage.create.mockResolvedValue({ id: 'm-2' });
      mockPrisma.smsConversation.update.mockResolvedValue({});

      const res = await service.startConversation({
        contactPhone: '+919876543210',
        contactName: 'Ravi',
        initialMessage: 'Welcome',
      });
      expect(res.id).toBe('c-new');
      expect(mockPrisma.smsConversation.create).toHaveBeenCalled();
    });
  });

  describe('sendReply', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue(null);
      await expect(
        service.sendReply('c-none', { text: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if message content is empty', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({ id: 'c-1' });
      await expect(service.sendReply('c-1', { text: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should dispatch outbound SMS and record message', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({
        id: 'c-1',
        contactPhone: '+919876543210',
        assignedProvider: 'TWILIO',
        assignedSenderPhone: '+1234567890',
        lead: { id: 'lead-1' },
      });
      mockPrisma.smsIntegration.findFirst.mockResolvedValue({
        apiKey: 'test-key',
        authToken: 'test-auth',
      });
      mockPrisma.smsMessage.create.mockResolvedValue({ id: 'msg-out' });
      mockPrisma.smsConversation.update.mockResolvedValue({});

      const res = await service.sendReply('c-1', {
        text: 'Welcome to Skyline!',
      });

      expect(res.id).toBe('msg-out');
      expect(mockAdapter.sendBatch).toHaveBeenCalled();
      expect(mockPrisma.smsMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'OUTBOUND',
            bodyText: 'Welcome to Skyline!',
          }),
        }),
      );
    });
  });

  describe('updateStatus, assignAgent, markRead', () => {
    it('should update conversation status', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.smsConversation.update.mockResolvedValue({
        id: 'c-1',
        status: 'closed',
      });

      const res = await service.updateStatus('c-1', 'closed');
      expect(res.status).toBe('closed');
    });

    it('should assign agent to conversation', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.smsConversation.update.mockResolvedValue({
        id: 'c-1',
        agentUserId: 'u-1',
      });

      const res = await service.assignAgent('c-1', 'u-1');
      expect(res.agentUserId).toBe('u-1');
    });

    it('should mark conversation as read', async () => {
      mockPrisma.smsConversation.update.mockResolvedValue({
        id: 'c-1',
        unreadCount: 0,
      });

      const res = await service.markRead('c-1');
      expect(res.unreadCount).toBe(0);
    });
  });

  describe('draftAiReply', () => {
    it('should generate suggested AI reply from recent conversation thread', async () => {
      mockPrisma.smsConversation.findUnique.mockResolvedValue({
        id: 'c-1',
        contactName: 'Pooja',
        lead: { firstName: 'Pooja', status: 'INTERESTED' },
      });
      mockPrisma.smsMessage.findMany.mockResolvedValue([
        {
          direction: 'INBOUND',
          bodyText: 'What are the payment plans?',
          createdAt: new Date(),
        },
      ]);

      const res = await service.draftAiReply('c-1', { instruction: 'formal' });

      expect(mockAiService.generateAutoreply).toHaveBeenCalled();
      expect(res.text).toBe('Hi, we have 2BHK starting from 85L.');
    });
  });
});
