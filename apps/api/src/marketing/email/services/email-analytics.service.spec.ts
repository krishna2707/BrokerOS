jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { EmailAnalyticsService } from './email-analytics.service.js';

describe('EmailAnalyticsService', () => {
  let service: EmailAnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      marketingCampaign: {
        findUnique: jest.fn(),
      },
      campaignRecipient: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      emailTrackingEvent: {
        findMany: jest.fn(),
      },
      campaignSenderPool: {
        findMany: jest.fn(),
      },
      emailInboundMessage: {
        findMany: jest.fn(),
      },
    };

    service = new EmailAnalyticsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaignAnalytics', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.marketingCampaign.findUnique.mockResolvedValue(null);

      await expect(
        service.getCampaignAnalytics('camp-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate analytics summary with domain breakdown and top links', async () => {
      mockPrisma.marketingCampaign.findUnique.mockResolvedValue({
        id: 'camp-1',
        title: 'Luxury Villa Launch',
        status: 'COMPLETED',
        providerType: 'AWS_SES',
        totalRecipients: 100,
        sentCount: 100,
        deliveredCount: 90,
        openedCount: 45,
        clickedCount: 20,
        bouncedCount: 5,
        unsubscribedCount: 2,
        complaintCount: 1,
      });

      // Mock recipient counts: total, delivered, opened, clicked, bounced
      mockPrisma.campaignRecipient.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(90) // delivered
        .mockResolvedValueOnce(45) // opened
        .mockResolvedValueOnce(20) // clicked
        .mockResolvedValueOnce(5); // bounced

      // Mock clicks for linkMap
      mockPrisma.emailTrackingEvent.findMany.mockResolvedValue([
        { urlClicked: 'https://example.com/brochure' },
        { urlClicked: 'https://example.com/brochure' },
        { urlClicked: 'https://example.com/floorplan' },
      ]);

      // Mock sender pools
      mockPrisma.campaignSenderPool.findMany.mockResolvedValue([
        {
          id: 'pool-1',
          allocatedRecipients: 100,
          sentCount: 100,
          deliveredCount: 90,
          senderDomain: {
            domain: 'mail.skyline.com',
            fromEmail: 'sales@mail.skyline.com',
            fromName: 'Sales Team',
            integration: { provider: 'AWS_SES', name: 'SES Gateway' },
          },
        },
      ]);

      // Counts for pool breakdown (delivered, opened, clicked, bounced)
      mockPrisma.campaignRecipient.count
        .mockResolvedValueOnce(90)
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5);

      const result = await service.getCampaignAnalytics('camp-1');

      expect(result.campaignId).toBe('camp-1');
      expect(result.deliveryRate).toBe(90);
      expect(result.openRate).toBe(50); // 45 / 90 * 100
      expect(result.clickRate).toBe(22.2); // 20 / 90 * 100
      expect(result.topClickedLinks).toEqual([
        { url: 'https://example.com/brochure', clicks: 2 },
        { url: 'https://example.com/floorplan', clicks: 1 },
      ]);
      expect(result.domainBreakdown).toBeDefined();
      expect(result.domainBreakdown?.[0].domain).toBe('mail.skyline.com');
    });

    it('should return 0 rates when sentCount and deliveredCount are 0', async () => {
      mockPrisma.marketingCampaign.findUnique.mockResolvedValue({
        id: 'camp-2',
        title: 'Draft Campaign',
        status: 'DRAFT',
        providerType: 'SYSTEM_DEFAULT',
        totalRecipients: 0,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
        complaintCount: 0,
      });

      mockPrisma.campaignRecipient.count.mockResolvedValue(0);
      mockPrisma.emailTrackingEvent.findMany.mockResolvedValue([]);
      mockPrisma.campaignSenderPool.findMany.mockResolvedValue([]);

      const result = await service.getCampaignAnalytics('camp-2');

      expect(result.deliveryRate).toBe(0);
      expect(result.openRate).toBe(0);
      expect(result.clickRate).toBe(0);
      expect(result.bounceRate).toBe(0);
      expect(result.topClickedLinks).toEqual([]);
      expect(result.domainBreakdown).toBeUndefined();
    });
  });

  describe('getCampaignRecipients', () => {
    it('should fetch recipients with counts and filters', async () => {
      mockPrisma.emailInboundMessage.findMany.mockResolvedValue([
        { matchedRecipientId: 'rec-1' },
      ]);

      // Mock live counter breakdown: total, opened, clicked, bounced, crmLeads
      mockPrisma.campaignRecipient.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(20) // opened
        .mockResolvedValueOnce(10) // clicked
        .mockResolvedValueOnce(2) // bounced
        .mockResolvedValueOnce(15) // in CRM
        .mockResolvedValueOnce(1); // filtered total count

      mockPrisma.campaignRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+919876543210',
          openCount: 2,
          clickCount: 1,
          lead: { id: 'lead-1', firstName: 'Priya', lastName: 'Sharma' },
        },
      ]);

      const result = await service.getCampaignRecipients('camp-1', {
        page: 1,
        limit: 10,
        status: 'OPENED',
        search: 'priya',
        crmStatus: 'IN_CRM',
        engagement: 'OPENED',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].hasReplied).toBe(true);
      expect(result.counts.all).toBe(50);
      expect(result.counts.replied).toBe(1);
      expect(result.counts.inCrm).toBe(15);
      expect(result.counts.unpromoted).toBe(35);
    });

    it('should handle different engagement filters', async () => {
      mockPrisma.emailInboundMessage.findMany.mockResolvedValue([]);
      mockPrisma.campaignRecipient.count.mockResolvedValue(0);
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([]);

      // Test UNOPENED, CLICKED, BOUNCED, REPLIED engagement queries
      await service.getCampaignRecipients('camp-1', { engagement: 'UNOPENED' });
      await service.getCampaignRecipients('camp-1', { engagement: 'CLICKED' });
      await service.getCampaignRecipients('camp-1', { engagement: 'BOUNCED' });
      await service.getCampaignRecipients('camp-1', { engagement: 'REPLIED' });
      await service.getCampaignRecipients('camp-1', {
        crmStatus: 'UNPROMOTED',
      });

      expect(mockPrisma.campaignRecipient.findMany).toHaveBeenCalled();
    });
  });
});
