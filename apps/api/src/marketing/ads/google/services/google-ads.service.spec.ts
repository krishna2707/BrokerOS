jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-google', () => ({
  GoogleAdsApiClient: class {
    generateOAuthUrl = jest
      .fn()
      .mockReturnValue('https://accounts.google.com/auth');
    exchangeCodeForTokens = jest
      .fn()
      .mockResolvedValue({ refreshToken: 'ref-1', accessToken: 'acc-1' });
    listAccessibleCustomers = jest.fn().mockResolvedValue(['1234567890']);
    formatDisplayCustomerId = jest
      .fn()
      .mockImplementation((id: string) => `formatted-${id}`);
    cleanCustomerId = jest
      .fn()
      .mockImplementation((id: string) => id.replace(/\D/g, ''));
    refreshAccessToken = jest.fn().mockResolvedValue('new-token');
    getAccountDetails = jest.fn().mockResolvedValue({
      customerId: '1234567890',
      descriptiveName: 'Test Account',
    });
  },
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service.js';

describe('GoogleAdsService', () => {
  let service: GoogleAdsService;
  let mockPrisma: any;
  let mockSyncService: any;

  beforeEach(() => {
    mockPrisma = {
      googleAdIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      googleCampaignCache: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockSyncService = {
      syncIntegration: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new GoogleAdsService(mockPrisma, mockSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOAuthUrl', () => {
    it('should generate oauth url', () => {
      const url = service.getOAuthUrl('http://localhost/cb', 'state-123');
      expect(url).toBe('https://accounts.google.com/auth');
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code and return discovered customer accounts', async () => {
      const res = await service.handleOAuthCallback({
        code: 'auth-code',
        redirectUri: 'http://localhost/cb',
      });

      expect(res.refreshToken).toBe('ref-1');
      expect(res.totalDiscovered).toBe(1);
      expect(res.discoveredAccounts[0].customerId).toBe('1234567890');
    });
  });

  describe('testConnection', () => {
    it('should verify refresh token and return account info', async () => {
      const res = await service.testConnection({
        customerId: '123-456-7890',
        refreshToken: 'ref-token',
      });

      expect(res.success).toBe(true);
      expect(res.account.customerId).toBe('1234567890');
    });
  });

  describe('connectIntegration', () => {
    it('should save integration and trigger sync', async () => {
      mockPrisma.googleAdIntegration.create.mockResolvedValue({
        id: 'g-int-1',
        name: 'Google Ads (formatted-1234567890)',
      });

      const res = await service.connectIntegration({
        customerId: '1234567890',
        refreshToken: 'valid-ref-token',
      });

      expect(mockPrisma.googleAdIntegration.create).toHaveBeenCalled();
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith('g-int-1');
      expect(res.id).toBe('g-int-1');
    });
  });

  describe('listIntegrations', () => {
    it('should return mapped integrations with formatted customer IDs', async () => {
      mockPrisma.googleAdIntegration.findMany.mockResolvedValue([
        {
          id: 'g-int-1',
          name: 'My Google Ads',
          customerId: '1234567890',
          isActive: true,
          _count: { campaigns: 2, webhookLogs: 10 },
        },
      ]);

      const res = await service.listIntegrations();
      expect(res.length).toBe(1);
      expect(res[0].formattedCustomerId).toBe('formatted-1234567890');
    });
  });

  describe('deleteIntegration', () => {
    it('should throw NotFoundException if integration not found', async () => {
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue(null);

      await expect(service.deleteIntegration('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete integration by id', async () => {
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue({
        id: 'g-int-1',
      });
      mockPrisma.googleAdIntegration.delete.mockResolvedValue({
        id: 'g-int-1',
      });

      const res = await service.deleteIntegration('g-int-1');
      expect(res.id).toBe('g-int-1');
    });
  });

  describe('getCampaigns', () => {
    it('should return cached campaigns with aggregated KPIs', async () => {
      mockPrisma.googleCampaignCache.findMany.mockResolvedValue([
        {
          id: 'camp-1',
          campaignName: 'Search - Luxury Villas',
          campaignStatus: 'ENABLED',
          impressions: 1000,
          clicks: 100,
          conversions: 10,
          costMicros: BigInt(50000000), // 50 INR
          integration: { id: 'g-1', name: 'Google Ads' },
        },
      ]);

      const res = await service.getCampaigns('g-1');
      expect(res.items.length).toBe(1);
      expect(res.kpis.totalImpressions).toBe(1000);
      expect(res.kpis.totalClicks).toBe(100);
      expect(res.kpis.totalConversions).toBe(10);
    });
  });
});
