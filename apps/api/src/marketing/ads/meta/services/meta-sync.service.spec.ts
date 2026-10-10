jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-meta', () => ({
  MetaGraphApiClient: class {
    getAccountDetails = jest.fn().mockResolvedValue({
      accountStatus: 1,
      currency: 'INR',
      timezoneName: 'Asia/Kolkata',
    });
    getCampaigns = jest.fn().mockResolvedValue([
      {
        id: 'meta-camp-1',
        name: 'Lead Gen - Delhi NCR',
        objective: 'OUTCOME_LEADS',
        status: 'ACTIVE',
        effectiveStatus: 'ACTIVE',
        dailyBudget: 5000,
        lifetimeBudget: null,
        insights: {
          spend: 25000,
          impressions: 120000,
          reach: 85000,
          clicks: 3400,
          ctr: 2.83,
          cpc: 7.35,
          cpm: 208.33,
          leadsCount: 65,
          costPerLead: 384.61,
        },
        startTime: '2026-02-01',
        stopTime: null,
      },
    ]);
    getAdSets = jest
      .fn()
      .mockResolvedValue([{ id: 'adset-1', name: 'HNIs 35-55' }]);
    getAdsAndCreatives = jest.fn().mockResolvedValue([
      {
        id: 'ad-1',
        name: 'Villa Image Ad',
        creative: { id: 'cr-1', title: 'Luxury Living' },
      },
    ]);
  },
}));

import { NotFoundException } from '@nestjs/common';
import { MetaSyncService } from './meta-sync.service.js';

describe('MetaSyncService', () => {
  let service: MetaSyncService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      metaAdIntegration: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      metaCampaignCache: {
        upsert: jest.fn(),
      },
    };

    service = new MetaSyncService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncIntegration', () => {
    it('should throw NotFoundException if integration not found in DB', async () => {
      mockPrisma.metaAdIntegration.findUnique.mockResolvedValue(null);

      await expect(service.syncIntegration('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should sync account details, campaigns, adsets, creatives and upsert cache', async () => {
      mockPrisma.metaAdIntegration.findUnique.mockResolvedValue({
        id: 'meta-int-1',
        name: 'Company Meta Ads',
        adAccountId: 'act_987654321',
        accessToken: 'access-token-live',
        pageIds: ['page-1', 'page-2'],
      });
      mockPrisma.metaAdIntegration.update.mockResolvedValue({
        id: 'meta-int-1',
      });
      mockPrisma.metaCampaignCache.upsert.mockResolvedValue({
        id: 'meta-camp-1',
      });

      const res = await service.syncIntegration('meta-int-1');

      expect(res.success).toBe(true);
      expect(res.adAccountId).toBe('act_987654321');
      expect(res.syncedCampaignsCount).toBe(1);
      expect(res.totalCampaignsCount).toBe(1);

      // Verify account details update
      expect(mockPrisma.metaAdIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meta-int-1' },
          data: expect.objectContaining({
            accountStatus: 1,
            currency: 'INR',
            timezone: 'Asia/Kolkata',
          }),
        }),
      );

      // Verify campaign cache upsert
      expect(mockPrisma.metaCampaignCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meta-camp-1' },
          create: expect.objectContaining({
            id: 'meta-camp-1',
            name: 'Lead Gen - Delhi NCR',
            objective: 'OUTCOME_LEADS',
            status: 'ACTIVE',
            spend: 25000,
            leadsCount: 65,
          }),
        }),
      );

      // Verify final lastSyncedAt update
      expect(mockPrisma.metaAdIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meta-int-1' },
          data: expect.objectContaining({
            lastSyncedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should rethrow error if Meta API getCampaigns throws', async () => {
      mockPrisma.metaAdIntegration.findUnique.mockResolvedValue({
        id: 'meta-int-1',
        adAccountId: 'act_123',
        accessToken: 'token',
      });
      (service as any).client.getCampaigns = jest
        .fn()
        .mockRejectedValue(new Error('Rate limit reached'));

      await expect(service.syncIntegration('meta-int-1')).rejects.toThrow(
        'Rate limit reached',
      );
    });
  });
});
