jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { SmsTrackingService } from './sms-tracking.service.js';

describe('SmsTrackingService', () => {
  let service: SmsTrackingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsShortLink: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      smsTrackingEvent: {
        create: jest.fn(),
      },
      smsRecipient: {
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      smsCampaign: {
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    service = new SmsTrackingService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveShortLink', () => {
    it('should return fallback if link code not found', async () => {
      mockPrisma.smsShortLink.findUnique.mockResolvedValue(null);

      const url = await service.resolveShortLink('invalid123');
      expect(url).toBe('https://brokeros.io');
    });

    it('should track click event in transaction and return destination url', async () => {
      mockPrisma.smsShortLink.findUnique.mockResolvedValue({
        id: 'link-1',
        code: 'xyz123',
        destinationUrl: 'https://skyline.com/promo',
        campaignId: 'camp-1',
        recipientId: 'rec-1',
      });

      const url = await service.resolveShortLink(
        'xyz123',
        '1.1.1.1',
        'Mobile Safari',
      );

      expect(url).toBe('https://skyline.com/promo');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('processWebhookEvents', () => {
    it('should increment delivered count on DELIVERED event', async () => {
      await service.processWebhookEvents([
        {
          providerMessageId: 'msg-tw-1',
          eventType: 'DELIVERED',
          recipientPhone: '+919876543210',
          campaignId: 'camp-1',
          timestamp: new Date(),
        },
      ]);

      expect(mockPrisma.smsCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-1' },
          data: { deliveredCount: { increment: 1 } },
        }),
      );
      expect(mockPrisma.smsRecipient.updateMany).toHaveBeenCalled();
    });

    it('should increment failed count on FAILED event', async () => {
      await service.processWebhookEvents([
        {
          providerMessageId: 'msg-tw-2',
          eventType: 'FAILED',
          recipientPhone: '+919876543210',
          campaignId: 'camp-1',
          metadata: { reason: 'Undelivered route' },
          timestamp: new Date(),
        },
      ]);

      expect(mockPrisma.smsCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-1' },
          data: { failedCount: { increment: 1 } },
        }),
      );
      expect(mockPrisma.smsRecipient.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failReason: 'Undelivered route',
          }),
        }),
      );
    });
  });
});
