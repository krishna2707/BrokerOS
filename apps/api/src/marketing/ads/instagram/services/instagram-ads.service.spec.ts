jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { InstagramAdsService } from './instagram-ads.service.js';

describe('InstagramAdsService', () => {
  let service: InstagramAdsService;
  let mockPrisma: any;
  let mockSyncService: any;

  beforeEach(() => {
    mockPrisma = {
      metaCampaignCache: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      metaLeadWebhookLog: {
        findMany: jest.fn(),
      },
      metaAdIntegration: {
        findFirst: jest.fn(),
      },
    };

    mockSyncService = {
      syncIntegration: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new InstagramAdsService(mockPrisma, mockSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should compute aggregated KPIs, placement breakdown, and format campaigns', async () => {
      mockPrisma.metaCampaignCache.findMany.mockResolvedValue([
        {
          id: 'camp-ig-1',
          name: 'Luxury Penthouses Reels Campaign',
          status: 'ACTIVE',
          spend: 10000,
          impressions: 100000,
          reach: 80000,
          clicks: 2500,
          leadsCount: 50,
          adSetsData: [
            {
              targeting: {
                instagram_positions: ['reels', 'story'],
              },
            },
          ],
          creativesData: [{ id: 'cr-1' }],
          integration: {
            id: 'meta-int-1',
            name: 'Meta Ad Account',
            currency: 'INR',
          },
        },
      ]);

      const res = await service.getOverview('meta-int-1');

      expect(res.kpis.totalSpend).toBe(10000);
      expect(res.kpis.totalImpressions).toBe(100000);
      expect(res.kpis.totalLeads).toBe(50);
      expect(res.kpis.avgCpl).toBe(200);
      expect(res.kpis.avgCtr).toBe(2.5);

      // Verify placement breakdown calculation
      expect(res.placementBreakdown.reels.spend).toBe(4500); // 45% of 10000
      expect(res.placementBreakdown.stories.spend).toBe(3500); // 35% of 10000
      expect(res.placementBreakdown.feed.spend).toBe(1500); // 15% of 10000
      expect(res.placementBreakdown.reels.leadsCount).toBe(25); // 50% of 50

      // Verify formatted campaigns
      expect(res.items.length).toBe(1);
      expect(res.items[0].placements).toContain('REELS');
      expect(res.items[0].placements).toContain('STORY');
      expect(res.items[0].adSetsCount).toBe(1);
      expect(res.items[0].creativesCount).toBe(1);
    });
  });

  describe('getCampaignDetails', () => {
    it('should throw NotFoundException if campaign not found in cache', async () => {
      mockPrisma.metaCampaignCache.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignDetails('invalid-ig-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return campaign details with formatted 9:16 vertical creatives and acquired leads', async () => {
      mockPrisma.metaCampaignCache.findUnique.mockResolvedValue({
        id: 'camp-ig-1',
        name: 'Super Luxury Residences',
        creativesData: [
          {
            id: 'cr-1',
            name: 'Reels Video 1',
            title: 'Own a Private Penthouse',
            body: 'Unmatched skyline views.',
            imageUrl: 'https://img.example.com/1.jpg',
          },
          {
            id: 'cr-2',
            name: 'Square Feed 2',
            title: 'Ready Possession',
            body: 'Book your slot now.',
          },
        ],
        adSetsData: [{ id: 'adset-1' }],
      });

      mockPrisma.metaLeadWebhookLog.findMany.mockResolvedValue([
        {
          id: 'log-ig-1',
          leadgenId: 'lg-999',
          createdAt: new Date(),
          lead: {
            id: 'lead-ig-1',
            firstName: 'Aarav',
            lastName: 'Kapoor',
            phone: '+919988776655',
            email: 'aarav@example.com',
            preferredLocation: 'Golf Course Extension',
            budget: 65000000,
            status: 'NEW',
            temperature: 'HOT',
            createdAt: new Date(),
            assignedUser: { id: 'u-1', name: 'Sales Manager' },
          },
        },
      ]);

      const res = await service.getCampaignDetails('camp-ig-1');

      expect(res.campaign.id).toBe('camp-ig-1');
      expect(res.creatives.length).toBe(2);
      expect(res.creatives[0].aspectRatio).toBe('9:16');
      expect(res.creatives[0].mediaType).toBe('VIDEO');
      expect(res.creatives[1].aspectRatio).toBe('1:1');
      expect(res.creatives[1].mediaType).toBe('IMAGE');
      expect(res.totalAcquiredLeads).toBe(1);
      expect(res.acquiredLeads[0].lead.name).toBe('Aarav Kapoor');
    });
  });

  describe('triggerSync', () => {
    it('should trigger sync with explicit integrationId', async () => {
      const res = await service.triggerSync('meta-int-explicit', 'last_30d');
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith(
        'meta-int-explicit',
        'last_30d',
      );
      expect(res.success).toBe(true);
    });

    it('should fallback to default integration if no integrationId provided', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue({
        id: 'meta-int-default',
        isActive: true,
      });

      const res = await service.triggerSync();

      expect(mockPrisma.metaAdIntegration.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { isDefault: 'desc' },
      });
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith(
        'meta-int-default',
        undefined,
      );
      expect(res.success).toBe(true);
    });

    it('should throw NotFoundException if no active integration found when fallback needed', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue(null);

      await expect(service.triggerSync()).rejects.toThrow(NotFoundException);
    });
  });
});
