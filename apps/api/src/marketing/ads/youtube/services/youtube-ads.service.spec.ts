jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-google', () => ({
  GoogleAdsApiClient: class {
    formatDisplayCustomerId = jest
      .fn()
      .mockImplementation((id: string) => `formatted-${id}`);
  },
}));

import { NotFoundException } from '@nestjs/common';
import { YouTubeAdsService } from './youtube-ads.service.js';

describe('YouTubeAdsService', () => {
  let service: YouTubeAdsService;
  let mockPrisma: any;
  let mockSyncService: any;

  beforeEach(() => {
    mockPrisma = {
      googleCampaignCache: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      googleLeadWebhookLog: {
        findMany: jest.fn(),
      },
    };

    mockSyncService = {
      syncIntegration: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new YouTubeAdsService(mockPrisma, mockSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should aggregate video metrics and derive formats for video campaigns', async () => {
      mockPrisma.googleCampaignCache.findMany.mockResolvedValue([
        {
          id: 'camp-yt-1',
          name: 'Penthouse Video Walkthrough',
          advertisingChannelType: 'VIDEO',
          status: 'ENABLED',
          dailyBudget: 2500,
          spend: 15000,
          impressions: 60000,
          clicks: 1200, // views = clicks * 3 = 3600
          conversions: 18,
          costPerConversion: 833.33,
          startTime: new Date('2026-01-01'),
          stopTime: null,
          integration: {
            id: 'g-int-1',
            name: 'Google Ads Account',
            customerId: '1234567890',
            currency: 'INR',
          },
        },
        {
          id: 'camp-yt-2',
          name: 'Quick Shorts Vertical Showcase',
          advertisingChannelType: 'DEMAND_GEN',
          status: 'ENABLED',
          dailyBudget: 1500,
          spend: 5000,
          impressions: 40000,
          clicks: 0, // views = impressions * 0.32 = 12800
          conversions: 10,
          costPerConversion: 500,
          startTime: null,
          stopTime: null,
          integration: {
            id: 'g-int-1',
            name: 'Google Ads Account',
            customerId: '1234567890',
            currency: 'INR',
          },
        },
      ]);

      const res = await service.getOverview('g-int-1');

      expect(res.items.length).toBe(2);
      expect(res.items[0].format).toBe('IN_STREAM_SKIPPABLE');
      expect(res.items[1].format).toBe('SHORTS');

      // KPIs
      expect(res.kpis.totalSpend).toBe(20000);
      expect(res.kpis.totalViews).toBe(3600 + 12800);
      expect(res.kpis.totalImpressions).toBe(100000);
      expect(res.kpis.totalLeads).toBe(28);
      expect(res.kpis.activeCampaignsCount).toBe(2);
      expect(res.kpis.avgCostPerLead).toBe(Math.round(20000 / 28));
    });
  });

  describe('getCampaignDetails', () => {
    it('should throw NotFoundException if video campaign not found in cache', async () => {
      mockPrisma.googleCampaignCache.findUnique.mockResolvedValue(null);

      await expect(
        service.getCampaignDetails('invalid-yt-camp'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return video campaign details with retention benchmarks and mapped leads', async () => {
      mockPrisma.googleCampaignCache.findUnique.mockResolvedValue({
        id: 'camp-yt-1',
        name: 'Sector 62 Bumper Video Ad 6s',
        advertisingChannelType: 'VIDEO',
        clicks: 500,
        impressions: 20000,
        spend: 2500,
        integration: {
          id: 'g-int-1',
          name: 'Google Ads',
          customerId: '9998887777',
          currency: 'INR',
        },
      });

      mockPrisma.googleLeadWebhookLog.findMany.mockResolvedValue([
        {
          id: 'log-yt-1',
          googleLeadId: 'g-lead-555',
          formId: 'form-yt',
          gclid: 'gclid-yt-123',
          createdAt: new Date(),
          lead: {
            id: 'lead-yt-1',
            firstName: 'Rohan',
            lastName: 'Sharma',
            phone: '+919876500000',
            email: 'rohan@example.com',
            preferredLocation: 'Noida Expressway',
            budget: 12000000,
            status: 'NEW',
            temperature: 'HOT',
            createdAt: new Date(),
            assignedUser: { id: 'u-1', name: 'Pre Sales Agent' },
          },
        },
      ]);

      const res = await service.getCampaignDetails('camp-yt-1');

      expect(res.campaign.id).toBe('camp-yt-1');
      expect(res.campaign.format).toBe('BUMPER');
      expect(res.campaign.views).toBe(1500); // 500 * 3
      expect(res.campaign.formattedCustomerId).toBe('formatted-9998887777');
      expect(res.retention.quartile25).toBe(68.5);
      expect(res.totalAcquiredLeads).toBe(1);
      expect(res.acquiredLeads[0].lead.name).toBe('Rohan Sharma');
    });
  });

  describe('triggerSync', () => {
    it('should delegate sync to GoogleSyncService', async () => {
      const res = await service.triggerSync('g-int-1', 'last_7d');
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith(
        'g-int-1',
        'last_7d',
      );
      expect(res.success).toBe(true);
    });
  });
});
