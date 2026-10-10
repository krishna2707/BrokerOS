jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

jest.mock('@brokeros/int-whatsapp', () => ({
  sendTextMessage: jest.fn().mockResolvedValue({ messageId: 'wa-msg-100' }),
  sendMediaMessage: jest.fn().mockResolvedValue({ messageId: 'wa-msg-101' }),
  sendTemplateMessage: jest.fn().mockResolvedValue({ messageId: 'wa-msg-102' }),
  sendInteractiveButtons: jest.fn().mockResolvedValue({ messageId: 'wa-msg-103' }),
  sendInteractiveList: jest.fn().mockResolvedValue({ messageId: 'wa-msg-104' }),
  sanitizePhoneForMeta: jest.fn((phone: string) => phone.replace(/[^\d+]/g, '')),
  phoneVariants: jest.fn((phone: string) => [phone]),
  isRecipientNotAllowedError: jest.fn(() => false),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppMessagesService } from './whatsapp-messages.service.js';
import { sendTextMessage, sendMediaMessage, sendTemplateMessage } from '@brokeros/int-whatsapp';

describe('WhatsAppMessagesService', () => {
  let service: WhatsAppMessagesService;
  let mockPrisma: any;
  let mockConfigService: any;
  let mockRealtimeGateway: any;
  let mockFlowEngine: any;

  beforeEach(() => {
    mockConfigService = {
      getDecryptedAccount: jest.fn(),
    };

    mockRealtimeGateway = {
      emitMessageSent: jest.fn(),
    };

    mockFlowEngine = {
      handleAgentPreemption: jest.fn().mockResolvedValue(true),
    };

    mockPrisma = {
      whatsAppConversation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      whatsAppContact: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppMessage: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      whatsAppTemplate: {
        findFirst: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
      },
    };

    service = new WhatsAppMessagesService(
      mockConfigService,
      mockRealtimeGateway,
      mockFlowEngine,
    );
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMessages', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue(null);

      await expect(service.getMessages('none', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return paginated messages with template fallback text', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({ id: 'conv-1' });
      mockPrisma.whatsAppMessage.findMany.mockResolvedValue([
        {
          id: 'm-1',
          type: 'TEMPLATE',
          body: null,
          template: { bodyText: 'Hello {{1}}' },
        },
      ]);
      mockPrisma.whatsAppMessage.count.mockResolvedValue(1);

      const res = await service.getMessages('conv-1', { page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.items[0].body).toBe('Hello {{1}}');
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('none', { type: 'text', text: 'Hi' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account configuration not found', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-missing',
        contactPhone: '+919876543210',
      });
      mockConfigService.getDecryptedAccount.mockResolvedValue(null);

      await expect(
        service.sendMessage('conv-1', { type: 'text', text: 'Hi' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should dispatch text message and broadcast realtime event', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        contactPhone: '+919876543210',
      });
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        phoneNumberId: 'phone-meta-1',
        accessToken: 'token-meta-1',
      });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-1',
        waMessageId: 'wa-msg-100',
        sentAt: new Date(),
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({});

      const res = await service.sendMessage(
        'conv-1',
        { type: 'text', text: 'Hello, welcome to Skyline!' },
        { id: 'user-1', name: 'John Doe' },
      );

      expect(sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumberId: 'phone-meta-1',
          accessToken: 'token-meta-1',
          to: '+919876543210',
          text: 'Hello, welcome to Skyline!',
        }),
      );
      expect(mockRealtimeGateway.emitMessageSent).toHaveBeenCalledWith(
        'conv-1',
        expect.any(Object),
        'acc-1',
      );
      expect(mockFlowEngine.handleAgentPreemption).toHaveBeenCalledWith('conv-1');
      expect(res.id).toBe('msg-1');
    });

    it('should dispatch media message when type is media', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        contactPhone: '+919876543210',
      });
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        phoneNumberId: 'phone-meta-1',
        accessToken: 'token-meta-1',
      });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-media-1',
        waMessageId: 'wa-msg-101',
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({});

      const res = await service.sendMessage('conv-1', {
        type: 'media',
        mediaKind: 'image',
        mediaUrl: 'https://cdn.example.com/brochure.jpg',
        caption: 'Luxury Villa Master Plan',
      });

      expect(sendMediaMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'image',
          link: 'https://cdn.example.com/brochure.jpg',
          caption: 'Luxury Villa Master Plan',
        }),
      );
      expect(res.id).toBe('msg-media-1');
    });

    it('should dispatch template message and interpolate template parameters', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        contactPhone: '+919876543210',
      });
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        phoneNumberId: 'phone-meta-1',
        accessToken: 'token-meta-1',
      });
      mockPrisma.whatsAppTemplate.findFirst.mockResolvedValue({
        id: 'tmpl-1',
        bodyText: 'Hello {{1}}, welcome to {{2}}!',
      });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-tmpl-1',
        body: 'Hello Amit, welcome to Skyline Skyvillas!',
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({});

      const res = await service.sendMessage('conv-1', {
        type: 'template',
        templateName: 'welcome_lead',
        templateParams: ['Amit', 'Skyline Skyvillas'],
      });

      expect(sendTemplateMessage).toHaveBeenCalled();
      expect(mockPrisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            templateId: 'tmpl-1',
            body: 'Hello Amit, welcome to Skyline Skyvillas!',
          }),
        }),
      );
      expect(res.id).toBe('msg-tmpl-1');
    });
  });

  describe('sendTemplateDirect', () => {
    it('should throw BadRequestException if templateName missing', async () => {
      await expect(
        service.sendTemplateDirect({ templateName: '' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-create contact and conversation if recipient not in DB and send template', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(null);
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppContact.create.mockResolvedValue({
        id: 'c-direct-1',
        accountId: 'acc-1',
        phone: '+919876543210',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppConversation.create.mockResolvedValue({
        id: 'conv-direct-1',
        accountId: 'acc-1',
      });

      // Mock sendMessage execution
      jest.spyOn(service, 'sendMessage').mockResolvedValue({
        id: 'msg-direct-1',
        waMessageId: 'wa-msg-direct',
      } as any);

      const res = await service.sendTemplateDirect({
        to: '+919876543210',
        templateName: 'campaign_vip',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe('msg-direct-1');
      expect(res.conversationId).toBe('conv-direct-1');
    });
  });
});
