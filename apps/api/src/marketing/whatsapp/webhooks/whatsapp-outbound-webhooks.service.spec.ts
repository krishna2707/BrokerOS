jest.mock('@brokeros/int-whatsapp', () => ({
  postSafeWebhook: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppOutboundWebhooksService } from './whatsapp-outbound-webhooks.service.js';
import { postSafeWebhook } from '@brokeros/int-whatsapp';

describe('WhatsAppOutboundWebhooksService', () => {
  let service: WhatsAppOutboundWebhooksService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      whatsAppWebhookEndpoint: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppOutboundWebhooksService],
    }).compile();

    service = module.get<WhatsAppOutboundWebhooksService>(
      WhatsAppOutboundWebhooksService,
    );
    (service as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listEndpoints', () => {
    it('should return endpoints with masked secrets', async () => {
      mockPrisma.whatsAppWebhookEndpoint.findMany.mockResolvedValue([
        {
          id: 'ep-1',
          accountId: 'acc-1',
          url: 'https://example.com/webhook',
          secret: 'supersecret',
          events: ['message.received'],
        },
      ]);

      const res = await service.listEndpoints('acc-1');
      expect(mockPrisma.whatsAppWebhookEndpoint.findMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual([
        {
          id: 'ep-1',
          accountId: 'acc-1',
          url: 'https://example.com/webhook',
          secret: '••••••••',
          events: ['message.received'],
        },
      ]);
    });
  });

  describe('createEndpoint', () => {
    it('should throw BadRequestException if required fields are missing', async () => {
      await expect(
        service.createEndpoint('acc-1', {
          url: '',
          secret: 'secret',
          events: ['*'],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createEndpoint('acc-1', {
          url: 'https://example.com',
          secret: '',
          events: ['*'],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createEndpoint('acc-1', {
          url: 'https://example.com',
          secret: 'secret',
          events: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create endpoint successfully and mask secret in response', async () => {
      mockPrisma.whatsAppWebhookEndpoint.create.mockResolvedValue({
        id: 'ep-new',
        accountId: 'acc-1',
        url: 'https://example.com/webhook',
        secret: 'mysecret',
        events: ['message.received'],
        isActive: true,
      });

      const res = await service.createEndpoint('acc-1', {
        url: '  https://example.com/webhook  ',
        secret: '  mysecret  ',
        events: ['message.received'],
      });

      expect(mockPrisma.whatsAppWebhookEndpoint.create).toHaveBeenCalledWith({
        data: {
          accountId: 'acc-1',
          url: 'https://example.com/webhook',
          secret: 'mysecret',
          events: ['message.received'],
          isActive: true,
        },
      });
      expect(res.secret).toBe('••••••••');
    });
  });

  describe('deleteEndpoint', () => {
    it('should throw NotFoundException if endpoint does not exist', async () => {
      mockPrisma.whatsAppWebhookEndpoint.findFirst.mockResolvedValue(null);

      await expect(service.deleteEndpoint('ep-missing', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete existing endpoint', async () => {
      mockPrisma.whatsAppWebhookEndpoint.findFirst.mockResolvedValue({
        id: 'ep-1',
        accountId: 'acc-1',
      });
      mockPrisma.whatsAppWebhookEndpoint.delete.mockResolvedValue({ id: 'ep-1' });

      const res = await service.deleteEndpoint('ep-1', 'acc-1');
      expect(mockPrisma.whatsAppWebhookEndpoint.delete).toHaveBeenCalledWith({
        where: { id: 'ep-1' },
      });
      expect(res).toEqual({ success: true });
    });
  });

  describe('dispatchEvent', () => {
    it('should dispatch event to matching active endpoints asynchronously', async () => {
      mockPrisma.whatsAppWebhookEndpoint.findMany.mockResolvedValue([
        {
          id: 'ep-1',
          accountId: 'acc-1',
          url: 'https://partner.com/hook',
          secret: 'sec-1',
          events: ['message.received'],
          failureCount: 0,
        },
        {
          id: 'ep-2',
          accountId: 'acc-1',
          url: 'https://other.com/hook',
          secret: 'sec-2',
          events: ['message.sent'], // does not match
          failureCount: 0,
        },
      ]);

      (postSafeWebhook as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

      service.dispatchEvent('acc-1', 'message.received', { text: 'Hello' });

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockPrisma.whatsAppWebhookEndpoint.findMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1', isActive: true },
      });
      expect(postSafeWebhook).toHaveBeenCalledTimes(1);
      expect(postSafeWebhook).toHaveBeenCalledWith(
        'https://partner.com/hook',
        expect.objectContaining({
          event: 'message.received',
          accountId: 'acc-1',
          data: { text: 'Hello' },
        }),
        'sec-1',
        { timeoutMs: 5000 },
      );
    });

    it('should increment failureCount when postSafeWebhook returns not ok', async () => {
      mockPrisma.whatsAppWebhookEndpoint.findMany.mockResolvedValue([
        {
          id: 'ep-1',
          accountId: 'acc-1',
          url: 'https://partner.com/hook',
          secret: 'sec-1',
          events: ['*'],
          failureCount: 4,
        },
      ]);

      (postSafeWebhook as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

      service.dispatchEvent('acc-1', 'message.received', { text: 'Hello' });

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockPrisma.whatsAppWebhookEndpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ep-1' },
          data: expect.objectContaining({
            failureCount: 5,
            isActive: false,
          }),
        }),
      );
    });
  });
});
