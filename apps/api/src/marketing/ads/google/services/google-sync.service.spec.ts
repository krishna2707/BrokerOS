jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-google', () => ({
  GoogleAdsApiClient: class {
    refreshAccessToken = jest.fn().mockResolvedValue('refreshed-access-token');
    getAccountDetails = jest.fn().mockResolvedValue({
      descriptiveName: 'Client Account Name',
      currencyCode: 'INR',
      timeZone: 'Asia/Kolkata',
    });
    getCampaigns = jest.fn().mockResolvedValue([
      {
        id: 'camp-1',
        name: 'Search Brand Campaign',
        channelType: 'SEARCH',
        status: 'ENABLED',
        dailyBudget: 1500,
        spend: 12000,
        impressions: 45000,
        clicks: 3200,
        ctr: 0.071,
        cpc: 3.75,
        conversions: 85,
        costPerConversion: 141.17,
        startTime: '2026-01-01',
        stopTime: null,
      },
    ]);
    getKeywordsAndQualityScores = jest
      .fn()
      .mockResolvedValue([
        { text: 'luxury 3bhk in gurgaon', matchType: 'EXACT', qualityScore: 9 },
      ]);
  },
}));

import { NotFoundException } from '@nestjs/common';
import { GoogleSyncService } from './google-sync.service.js';

describe('GoogleSyncService', () => {
  let service: GoogleSyncService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      googleAdIntegration: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      googleCampaignCache: {
        upsert: jest.fn(),
      },
    };

    service = new GoogleSyncService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncIntegration', () => {
    it('should throw NotFoundException if integration not found in DB', async () => {
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue(null);

      await expect(service.syncIntegration('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should refresh token, fetch details, query campaigns & keywords, and upsert cache', async () => {
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue({
        id: 'int-123',
        name: 'My Google Ads',
        customerId: '1234567890',
        refreshToken: 'refresh-token-xyz',
        managerCustomerId: '9876543210',
      });
      mockPrisma.googleAdIntegration.update.mockResolvedValue({
        id: 'int-123',
      });
      mockPrisma.googleCampaignCache.upsert.mockResolvedValue({ id: 'camp-1' });

      const res = await service.syncIntegration('int-123');

      expect(res.success).toBe(true);
      expect(res.customerId).toBe('1234567890');
      expect(res.syncedCampaignsCount).toBe(1);
      expect(res.totalCampaignsCount).toBe(1);

      // Verify integration account details updated
      expect(mockPrisma.googleAdIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-123' },
          data: expect.objectContaining({
            descriptiveName: 'Client Account Name',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
          }),
        }),
      );

      // Verify campaign cache upserted
      expect(mockPrisma.googleCampaignCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-1' },
          create: expect.objectContaining({
            id: 'camp-1',
            name: 'Search Brand Campaign',
            advertisingChannelType: 'SEARCH',
            status: 'ENABLED',
          }),
        }),
      );

      // Verify lastSyncedAt was updated
      expect(mockPrisma.googleAdIntegration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-123' },
          data: expect.objectContaining({
            lastSyncedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw error if token refresh fails', async () => {
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue({
        id: 'int-123',
        refreshToken: 'bad-token',
        customerId: '1234567890',
      });

      // Force refresh error on client
      (service as any).client.refreshAccessToken = jest
        .fn()
        .mockRejectedValue(new Error('Invalid Grant'));

      await expect(service.syncIntegration('int-123')).rejects.toThrow(
        /Google OAuth access token refresh failed/,
      );
    });
  });
});
