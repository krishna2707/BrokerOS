jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { SmsAnalyticsService } from './sms-analytics.service.js';

describe('SmsAnalyticsService', () => {
  let service: SmsAnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsCampaign: {
        findUnique: jest.fn(),
      },
      smsRecipient: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      smsShortLink: {
        findMany: jest.fn(),
      },
      campaignSmsSenderPool: {
        findMany: jest.fn(),
      },
      smsInboundMessage: {
        findMany: jest.fn(),
      },
    };

    service = new SmsAnalyticsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaignAnalytics', () => {
    it('should throw NotFoundException if campaign does not exist', async () => {
      mockPrisma.smsCampaign.findUnique.mockResolvedValue(null);

      await expect(
        service.getCampaignAnalytics('camp-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate accurate delivery, click, and fail rates with link map and sender pool breakdown', async () => {
      mockPrisma.smsCampaign.findUnique.mockResolvedValue({
        id: 'camp-1',
        title: 'Diwali SMS Blast',
        status: 'COMPLETED',
        providerType: 'TWILIO',
        fromSender: '+1234567890',
        totalRecipients: 100,
        sentCount: 100,
        totalSegmentsSent: 120,
      });

      // Recipient counts: total, delivered, clicked, failed
      mockPrisma.smsRecipient.count
        .mockResolvedValueOnce(100) // totalRecipientsCount
        .mockResolvedValueOnce(90) // deliveredCount
        .mockResolvedValueOnce(25) // clickedCount
        .mockResolvedValueOnce(10); // failedCount

      // Short links
      mockPrisma.smsShortLink.findMany.mockResolvedValue([
        { destinationUrl: 'https://skyline.com/offer', clicksCount: 15 },
        { destinationUrl: 'https://skyline.com/offer', clicksCount: 10 },
        { destinationUrl: 'https://skyline.com/brochure', clicksCount: 5 },
      ]);

      // Sender pools
      mockPrisma.campaignSmsSenderPool.findMany.mockResolvedValue([
        {
          id: 'pool-1',
          phoneNumber: '+1234567890',
          provider: 'TWILIO',
          allocatedRecipients: 100,
          sentCount: 100,
          deliveredCount: 90,
          failedCount: 10,
        },
      ]);

      // Per pool counts: poolDelivered, poolClicked, poolFailed
      mockPrisma.smsRecipient.count
        .mockResolvedValueOnce(90) // poolDelivered
        .mockResolvedValueOnce(25) // poolClicked
        .mockResolvedValueOnce(10); // poolFailed

      const res = await service.getCampaignAnalytics('camp-1');

      expect(res.campaignId).toBe('camp-1');
      expect(res.deliveredCount).toBe(90);
      expect(res.clickedCount).toBe(25);
      expect(res.failedCount).toBe(10);
      expect(res.deliveryRate).toBe(90);
      expect(res.clickRate).toBe(27.8); // 25 / 90 * 100
      expect(res.failRate).toBe(10);
      expect(res.topClickedLinks).toEqual([
        { url: 'https://skyline.com/offer', clicks: 25 },
        { url: 'https://skyline.com/brochure', clicks: 5 },
      ]);
      expect(res.senderBreakdown?.[0].deliveryRate).toBe(90);
    });
  });

  describe('getCampaignRecipients', () => {
    it('should paginate recipients with reply and engagement filters', async () => {
      mockPrisma.smsInboundMessage.findMany.mockResolvedValue([
        { matchedRecipientId: 'rec-1' },
      ]);

      // Counters: totalCount, deliveredCount, clickedCount, failedCount, crmLeadsCount
      mockPrisma.smsRecipient.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // delivered
        .mockResolvedValueOnce(10) // clicked
        .mockResolvedValueOnce(5) // failed
        .mockResolvedValueOnce(8); // crmLeadsCount

      // Filtered total count & items
      mockPrisma.smsRecipient.count.mockResolvedValueOnce(1);
      mockPrisma.smsRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          phone: '+919876543210',
          name: 'Rahul Sharma',
          status: 'DELIVERED',
          clickCount: 2,
          leadId: 'lead-1',
          lead: { id: 'lead-1', firstName: 'Rahul', lastName: 'Sharma' },
        },
      ]);

      const res = await service.getCampaignRecipients('camp-1', {
        page: 1,
        limit: 10,
        status: 'DELIVERED',
        search: 'Rahul',
      });

      expect(res.total).toBe(1);
      expect(res.items[0].hasReplied).toBe(true);
      expect(res.counters.repliedCount).toBe(1);
      expect(res.counters.totalCount).toBe(50);
    });
  });
});
