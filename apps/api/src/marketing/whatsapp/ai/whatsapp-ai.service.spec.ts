jest.mock('@brokeros/prisma', () => ({
  PrismaClient: class { },
  prismaClient: {},
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => { },
  AuthGuard: class { },
}));

jest.mock('@brokeros/int-whatsapp', () => ({
  encrypt: jest.fn((val: string) => `enc_${val}`),
  decrypt: jest.fn((val: string) => (val.startsWith('enc_') ? val.replace('enc_', '') : val)),
  sendTextMessage: jest.fn(),
  phoneVariants: jest.fn((p: string) => [p]),
}));

jest.mock('./engine/llm-provider.helper.js', () => ({
  callLlmChatCompletion: jest.fn().mockResolvedValue('Hello from AI!'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppAiService } from './whatsapp-ai.service.js';
import { WhatsAppConfigService } from '../config/whatsapp-config.service.js';
import { WhatsAppRealtimeGateway } from '../gateway/whatsapp-realtime.gateway.js';
import { callLlmChatCompletion } from './engine/llm-provider.helper.js';
import { sendTextMessage } from '@brokeros/int-whatsapp';

describe('WhatsAppAiService', () => {
  let service: WhatsAppAiService;
  let mockPrisma: any;
  let mockConfigService: any;
  let mockRealtimeGateway: any;

  beforeEach(async () => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppAiConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      whatsAppConversation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      whatsAppMessage: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      whatsAppAutomation: {
        count: jest.fn(),
      },
    };

    mockConfigService = {
      getDecryptedAccount: jest.fn(),
    };

    mockRealtimeGateway = {
      emitMessageSent: jest.fn(),
      emitConversationUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppAiService,
        { provide: WhatsAppConfigService, useValue: mockConfigService },
        { provide: WhatsAppRealtimeGateway, useValue: mockRealtimeGateway },
      ],
    }).compile();

    service = module.get<WhatsAppAiService>(WhatsAppAiService);
    (service as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAiConfig', () => {
    it('should return masked apiKey when config exists', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        id: 'ai-1',
        accountId: 'acc-1',
        apiKey: 'enc_secret_key',
        provider: 'groq',
      });

      const res = await service.getAiConfig('acc-1');
      expect(res).toEqual({
        id: 'ai-1',
        accountId: 'acc-1',
        apiKey: '••••••••',
        provider: 'groq',
      });
      expect(mockPrisma.whatsAppAiConfig.findUnique).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
      });
    });

    it('should resolve default account if accountId is not provided', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-default' });
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue(null);

      const res = await service.getAiConfig(undefined);
      expect(mockPrisma.whatsAppBusinessAccount.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toBeNull();
    });

    it('should return null if no target account exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      const res = await service.getAiConfig(undefined);
      expect(res).toBeNull();
    });
  });

  describe('saveAiConfig', () => {
    it('should throw BadRequestException if no account found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.saveAiConfig(undefined, { provider: 'groq', model: 'gpt-4o' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should encrypt and upsert AI config successfully', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue(null);
      mockPrisma.whatsAppAiConfig.upsert.mockResolvedValue({
        id: 'ai-1',
        accountId: 'acc-1',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: 'enc_my_key',
      });

      const res = await service.saveAiConfig('acc-1', {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: 'gsk_1234567890',
        systemPrompt: 'Be friendly',
      });

      expect(mockPrisma.whatsAppAiConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: 'acc-1' },
          create: expect.objectContaining({
            accountId: 'acc-1',
            provider: 'groq',
            apiKey: 'enc_gsk_1234567890',
          }),
        }),
      );
      expect(res.apiKey).toBe('••••••••');
    });

    it('should keep existing key when apiKey is placeholder', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        apiKey: 'enc_existing_key',
      });
      mockPrisma.whatsAppAiConfig.upsert.mockResolvedValue({
        id: 'ai-1',
        accountId: 'acc-1',
        apiKey: 'enc_existing_key',
        provider: 'openai',
      });

      const res = await service.saveAiConfig('acc-1', {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '••••••••',
      });

      expect(res.apiKey).toBe('••••••••');
    });

    it('should allow clearing key when empty string passed', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        apiKey: 'enc_existing_key',
      });
      mockPrisma.whatsAppAiConfig.upsert.mockResolvedValue({
        id: 'ai-1',
        accountId: 'acc-1',
        apiKey: '',
        provider: 'openai',
      });

      const res = await service.saveAiConfig('acc-1', {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '',
      });

      expect(res.apiKey).toBeNull();
    });
  });

  describe('deleteAiConfig', () => {
    it('should delete config for account', async () => {
      mockPrisma.whatsAppAiConfig.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.deleteAiConfig('acc-1');
      expect(res).toEqual({ success: true, message: 'AI configuration deleted' });
      expect(mockPrisma.whatsAppAiConfig.deleteMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
      });
    });
  });

  describe('draftReply', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue(null);

      await expect(service.draftReply('acc-1', 'conv-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if no AI key configured anywhere', async () => {
      const originalGroqKey = process.env.GROQ_API_KEY;
      const originalOpenAiKey = process.env.OPENAI_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
      });
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue(null);

      try {
        await expect(service.draftReply('acc-1', 'conv-1')).rejects.toThrow(
          BadRequestException,
        );
      } finally {
        if (originalGroqKey) process.env.GROQ_API_KEY = originalGroqKey;
        if (originalOpenAiKey) process.env.OPENAI_API_KEY = originalOpenAiKey;
      }
    });

    it('should draft reply using BYO config and recent messages', async () => {
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
        contact: { name: 'Alice' },
        agent: { name: 'Bob Agent' },
        lead: {
          firstName: 'Alice',
          lastName: 'Smith',
          interestedProject: { name: 'Skyline Towers', city: 'Mumbai' },
        },
      });

      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        accountId: 'acc-1',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: 'enc_gsk_valid_groq_key_12345',
      });

      mockPrisma.whatsAppMessage.findMany.mockResolvedValue([
        {
          id: 'm-1',
          direction: 'INBOUND',
          body: 'What is the price of 2BHK?',
          sentAt: new Date('2026-09-01T10:00:00Z'),
        },
      ]);

      (callLlmChatCompletion as jest.Mock).mockResolvedValue(
        'The 2BHK starts at ₹1.5 Cr.',
      );

      const res = await service.draftReply('acc-1', 'conv-1', 'Bob Agent', 'Mention discounts');
      expect(res).toEqual({ draft: 'The 2BHK starts at ₹1.5 Cr.' });
      expect(callLlmChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'groq',
          apiKey: 'gsk_valid_groq_key_12345',
          messages: [{ role: 'user', content: 'What is the price of 2BHK?' }],
        }),
      );
    });
  });

  describe('dispatchInboundToAiReply', () => {
    it('should early return if AI config is missing, inactive, or autoReply disabled', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        isActive: false,
        autoReplyEnabled: false,
      });

      await service.dispatchInboundToAiReply('acc-1', 'conv-1', 'contact-1');
      expect(mockPrisma.whatsAppAutomation.count).not.toHaveBeenCalled();
    });

    it('should early return if active message automations exist', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        isActive: true,
        autoReplyEnabled: true,
      });
      mockPrisma.whatsAppAutomation.count.mockResolvedValue(1);

      await service.dispatchInboundToAiReply('acc-1', 'conv-1', 'contact-1');
      expect(mockPrisma.whatsAppConversation.findUnique).not.toHaveBeenCalled();
    });

    it('should early return if human agent owns thread or conversation inactive', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        isActive: true,
        autoReplyEnabled: true,
      });
      mockPrisma.whatsAppAutomation.count.mockResolvedValue(0);
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isActive: true,
        agentUserId: 'user-agent-123',
      });

      await service.dispatchInboundToAiReply('acc-1', 'conv-1', 'contact-1');
      expect(mockConfigService.getDecryptedAccount).not.toHaveBeenCalled();
    });

    it('should generate draft and send auto-reply successfully', async () => {
      mockPrisma.whatsAppAiConfig.findUnique.mockResolvedValue({
        isActive: true,
        autoReplyEnabled: true,
        autoReplyMaxPerConversation: 3,
        apiKey: 'enc_gsk_test_key',
        provider: 'groq',
      });
      mockPrisma.whatsAppAutomation.count.mockResolvedValue(0);

      const conv = {
        id: 'conv-1',
        accountId: 'acc-1',
        isActive: true,
        agentUserId: null,
        aiAutoReplyDisabled: false,
        aiReplyCount: 0,
        contactPhone: '+919876543210',
        contact: { name: 'Alice' },
      };
      mockPrisma.whatsAppConversation.findUnique.mockResolvedValue(conv);
      mockPrisma.whatsAppMessage.findMany.mockResolvedValue([]);

      (callLlmChatCompletion as jest.Mock).mockResolvedValue('Auto AI Reply');
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        phoneNumberId: 'phone-meta-1',
        accessToken: 'token-123',
      });

      (sendTextMessage as jest.Mock).mockResolvedValue({ messageId: 'wa-meta-msg-1' });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'm-auto-1',
        waMessageId: 'wa-meta-msg-1',
        body: 'Auto AI Reply',
        sentAt: new Date(),
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({
        ...conv,
        aiReplyCount: 1,
      });

      await service.dispatchInboundToAiReply('acc-1', 'conv-1', 'contact-1');

      expect(sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNumberId: 'phone-meta-1',
          text: 'Auto AI Reply',
        }),
      );
      expect(mockRealtimeGateway.emitMessageSent).toHaveBeenCalledWith(
        'conv-1',
        expect.anything(),
        'acc-1',
      );
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalledWith(
        'acc-1',
        expect.anything(),
      );
    });
  });
});
