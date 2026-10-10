jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { EmailTrackingService } from './email-tracking.service.js';

describe('EmailTrackingService', () => {
  let service: EmailTrackingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
      emailTrackingEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      },
      campaignRecipient: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'rec-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      marketingCampaign: {
        update: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      },
      marketingUnsubscribe: {
        upsert: jest.fn().mockResolvedValue({ id: 'unsub-1' }),
      },
    };

    service = new EmailTrackingService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordOpenEvent', () => {
    it('should record open event in transaction', async () => {
      await service.recordOpenEvent(
        'camp-1',
        'rec-1',
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.emailTrackingEvent.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'camp-1',
          recipientId: 'rec-1',
          eventType: 'OPEN',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          status: 'OPENED',
          openCount: { increment: 1 },
          firstOpenedAt: expect.any(Date),
        },
      });
    });
  });

  describe('recordClickEvent', () => {
    it('should record click and infer first open if recipient was not opened yet', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue({
        id: 'rec-1',
        openCount: 0,
        firstOpenedAt: null,
      });

      await service.recordClickEvent(
        'camp-1',
        'rec-1',
        'https://skyline.com',
        '10.0.0.1',
        'Safari',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      // Should have 4 transaction operations: click event, update recipient, update campaign, open event
      const txArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(txArg.length).toBe(4);
    });

    it('should record click without inferring open if already opened', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue({
        id: 'rec-1',
        openCount: 3,
        firstOpenedAt: new Date('2026-01-01'),
      });

      await service.recordClickEvent('camp-1', 'rec-1', 'https://skyline.com');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const txArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(txArg.length).toBe(3);
    });
  });

  describe('recordUnsubscribe', () => {
    it('should upsert marketingUnsubscribe and update campaign counter', async () => {
      await service.recordUnsubscribe(
        'OptOut@Example.com',
        'camp-1',
        'Too many emails',
      );

      expect(mockPrisma.marketingUnsubscribe.upsert).toHaveBeenCalledWith({
        where: { email: 'optout@example.com' },
        create: {
          email: 'optout@example.com',
          campaignId: 'camp-1',
          reason: 'Too many emails',
        },
        update: {
          reason: 'Too many emails',
        },
      });
      expect(mockPrisma.marketingCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { unsubscribedCount: { increment: 1 } },
      });
    });
  });

  describe('processWebhookEvents', () => {
    it('should handle UNSUBSCRIBED, BOUNCED, and DELIVERED webhook events', async () => {
      const events: any[] = [
        {
          eventType: 'UNSUBSCRIBED',
          recipientEmail: 'user@example.com',
          campaignId: 'camp-1',
          metadata: { bounceReason: 'User unsubscribed' },
        },
        {
          eventType: 'BOUNCED',
          recipientEmail: 'bounce@example.com',
          campaignId: 'camp-1',
          metadata: { bounceReason: 'Mailbox full' },
        },
        {
          eventType: 'DELIVERED',
          recipientEmail: 'delivered@example.com',
          campaignId: 'camp-1',
        },
      ];

      await service.processWebhookEvents(events);

      expect(mockPrisma.marketingUnsubscribe.upsert).toHaveBeenCalled();
      expect(mockPrisma.campaignRecipient.updateMany).toHaveBeenCalledWith({
        where: { email: 'bounce@example.com', campaignId: 'camp-1' },
        data: {
          status: 'BOUNCED',
          bounceReason: 'Mailbox full',
          bouncedAt: expect.any(Date),
        },
      });
      expect(mockPrisma.campaignRecipient.updateMany).toHaveBeenCalledWith({
        where: { email: 'delivered@example.com', campaignId: 'camp-1' },
        data: { status: 'DELIVERED', deliveredAt: expect.any(Date) },
      });
    });
  });
});
