jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

jest.mock('@brokeros/int-whatsapp', () => ({
  sanitizePhoneForMeta: jest.fn((phone: string) => phone.replace(/[^\d+]/g, '')),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppConversationsService } from './whatsapp-conversations.service.js';

describe('WhatsAppConversationsService', () => {
  let service: WhatsAppConversationsService;
  let mockPrisma: any;
  let mockRealtimeGateway: any;

  beforeEach(() => {
    mockRealtimeGateway = {
      emitConversationUpdated: jest.fn(),
    };

    mockPrisma = {
      whatsAppContact: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppConversation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new WhatsAppConversationsService(mockRealtimeGateway);
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listConversations', () => {
    it('should return paginated conversations with agent and contact included', async () => {
      mockPrisma.whatsAppConversation.findMany.mockResolvedValue([
        {
          id: 'conv-1',
          contactPhone: '+919876543210',
          contactName: 'Rahul',
          status: 'open',
          agent: { id: 'a-1', name: 'Agent Smith' },
        },
      ]);
      mockPrisma.whatsAppConversation.count.mockResolvedValue(1);

      const res = await service.listConversations({ status: 'open' }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
      expect(mockPrisma.whatsAppConversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accountId: 'acc-1',
            status: 'open',
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('startOrCreateConversation', () => {
    it('should throw BadRequestException if neither contactId, phone, nor leadId provided', async () => {
      await expect(service.startOrCreateConversation({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if active account cannot be found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.startOrCreateConversation({ phone: '+919876543210' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing active conversation if found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({
        id: 'c-1',
        phone: '+919876543210',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue({
        id: 'conv-existing',
        accountId: 'acc-1',
        contactId: 'c-1',
      });

      const res = await service.startOrCreateConversation({ contactId: 'c-1' });

      expect(res.id).toBe('conv-existing');
      expect(mockPrisma.whatsAppConversation.create).not.toHaveBeenCalled();
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalled();
    });

    it('should create new conversation if none exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({
        id: 'c-1',
        phone: '+919876543210',
        name: 'New Buyer',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppConversation.create.mockResolvedValue({
        id: 'conv-new',
        accountId: 'acc-1',
        contactId: 'c-1',
        contactPhone: '+919876543210',
      });

      const res = await service.startOrCreateConversation({ contactId: 'c-1' });

      expect(res.id).toBe('conv-new');
      expect(mockPrisma.whatsAppConversation.create).toHaveBeenCalled();
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalledWith(
        'acc-1',
        expect.any(Object),
      );
    });
  });

  describe('getConversation', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(null);

      await expect(service.getConversation('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return conversation when found', async () => {
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        contactPhone: '+919876543210',
      });

      const res = await service.getConversation('conv-1');
      expect(res.id).toBe('conv-1');
    });
  });

  describe('updateStatus, assignAgent, markRead', () => {
    beforeEach(() => {
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
      });
    });

    it('should update conversation status', async () => {
      mockPrisma.whatsAppConversation.update.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        status: 'closed',
      });

      const res = await service.updateStatus('conv-1', 'closed');
      expect(res.status).toBe('closed');
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalled();
    });

    it('should assign agent to conversation', async () => {
      mockPrisma.whatsAppConversation.update.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        agentUserId: 'user-agent-1',
      });

      const res = await service.assignAgent('conv-1', 'user-agent-1');
      expect(res.agentUserId).toBe('user-agent-1');
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalled();
    });

    it('should mark conversation read by resetting unreadCount to 0', async () => {
      mockPrisma.whatsAppConversation.update.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        unreadCount: 0,
      });

      const res = await service.markRead('conv-1');
      expect(res.unreadCount).toBe(0);
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalled();
    });
  });
});
