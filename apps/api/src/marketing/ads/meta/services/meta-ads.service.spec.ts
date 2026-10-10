jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-meta', () => ({
  MetaGraphApiClient: class {
    validateCredentials = jest.fn().mockResolvedValue(true);
    getAccountDetails = jest.fn().mockResolvedValue({
      name: 'Main Meta Ad Account',
      currency: 'INR',
      timezoneName: 'Asia/Kolkata',
      accountStatus: 1,
    });
  },
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MetaAdsService } from './meta-ads.service.js';

describe('MetaAdsService', () => {
  let service: MetaAdsService;
  let mockPrisma: any;
  let mockSyncService: any;

  beforeEach(() => {
    mockPrisma = {
      metaAdIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      metaCampaignCache: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      metaLeadWebhookLog: {
        findMany: jest.fn(),
      },
      lead: {
        updateMany: jest.fn(),
      },
    };

    mockSyncService = {
      syncIntegration: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new MetaAdsService(mockPrisma, mockSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnection', () => {
    it('should validate credentials and return account details', async () => {
      const res = await service.testConnection({
        adAccountId: 'act_123456',
        accessToken: 'token_abc',
      });

      expect(res.success).toBe(true);
      expect(res.account.name).toBe('Main Meta Ad Account');
    });

    it('should throw BadRequestException if credentials invalid', async () => {
      (service as any).client.validateCredentials = jest
        .fn()
        .mockResolvedValue(false);

      await expect(
        service.testConnection({
          adAccountId: 'bad_act',
          accessToken: 'bad_token',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('connectIntegration', () => {
    it('should validate, unset previous defaults if isDefault, save and trigger sync', async () => {
      (service as any).client.validateCredentials = jest
        .fn()
        .mockResolvedValue(true);
      mockPrisma.metaAdIntegration.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.metaAdIntegration.create.mockResolvedValue({
        id: 'meta-int-1',
        name: 'Main Meta Ad Account',
      });

      const res = await service.connectIntegration({
        name: 'Main Meta Ad Account',
        adAccountId: 'act_123',
        accessToken: 'token_abc',
        isDefault: true,
      });

      expect(mockPrisma.metaAdIntegration.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrisma.metaAdIntegration.create).toHaveBeenCalled();
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith(
        'meta-int-1',
      );
      expect(res.id).toBe('meta-int-1');
    });
  });

  describe('listIntegrations', () => {
    it('should return list of integrations from prisma', async () => {
      mockPrisma.metaAdIntegration.findMany.mockResolvedValue([
        { id: 'meta-int-1', name: 'Account 1' },
      ]);

      const res = await service.listIntegrations();
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('meta-int-1');
    });
  });

  describe('deleteIntegration', () => {
    it('should throw NotFoundException if integration not found', async () => {
      mockPrisma.metaAdIntegration.findUnique.mockResolvedValue(null);

      await expect(service.deleteIntegration('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete integration by id', async () => {
      mockPrisma.metaAdIntegration.findUnique.mockResolvedValue({
        id: 'meta-int-1',
      });
      mockPrisma.metaAdIntegration.delete.mockResolvedValue({
        id: 'meta-int-1',
      });

      const res = await service.deleteIntegration('meta-int-1');
      expect(res.id).toBe('meta-int-1');
    });
  });

  describe('getCampaigns', () => {
    it('should aggregate kpi metrics across campaigns', async () => {
      mockPrisma.metaCampaignCache.findMany.mockResolvedValue([
        {
          id: 'camp-1',
          name: 'Summer Sale',
          status: 'ACTIVE',
          spend: 1000,
          impressions: 20000,
          reach: 15000,
          clicks: 400,
          leadsCount: 20,
        },
      ]);

      const res = await service.getCampaigns('meta-int-1');
      expect(res.kpis.totalSpend).toBe(1000);
      expect(res.kpis.totalImpressions).toBe(20000);
      expect(res.kpis.totalClicks).toBe(400);
      expect(res.kpis.totalLeads).toBe(20);
      expect(res.kpis.avgCpl).toBe(50);
      expect(res.kpis.avgCtr).toBe(2);
      expect(res.kpis.activeCampaignsCount).toBe(1);
      expect(res.items.length).toBe(1);
    });
  });

  describe('getCampaignDetails', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.metaCampaignCache.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignDetails('invalid-camp')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return campaign details with mapped acquired leads', async () => {
      mockPrisma.metaCampaignCache.findUnique.mockResolvedValue({
        id: 'camp-1',
        name: 'Luxury Penthouses',
      });
      mockPrisma.metaLeadWebhookLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          leadgenId: 'lg-100',
          formId: 'form-1',
          adId: 'ad-1',
          createdAt: new Date(),
          lead: {
            id: 'lead-1',
            firstName: 'Sarah',
            lastName: 'Connor',
            phone: '+919888877777',
            email: 'sarah@example.com',
            preferredLocation: 'South Delhi',
            budget: BigInt(30000000),
            status: 'NEW',
            temperature: 'HOT',
            createdAt: new Date(),
            assignedUser: { id: 'user-1', name: 'Agent Smith' },
          },
        },
      ]);

      const res = await service.getCampaignDetails('camp-1');
      expect(res.campaign.id).toBe('camp-1');
      expect(res.totalAcquiredLeads).toBe(1);
      expect(res.acquiredLeads[0].lead.name).toBe('Sarah Connor');
    });
  });

  describe('triggerSync', () => {
    it('should call syncService.syncIntegration', async () => {
      const res = await service.triggerSync('meta-int-1', 'last_7d');
      expect(mockSyncService.syncIntegration).toHaveBeenCalledWith(
        'meta-int-1',
        'last_7d',
      );
      expect(res.success).toBe(true);
    });
  });

  describe('bulkAssignLeadsToPreSales', () => {
    it('should throw BadRequestException if neither leadIds nor campaignId provided', async () => {
      await expect(service.bulkAssignLeadsToPreSales({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should bulk route explicit leadIds to unassigned queue', async () => {
      mockPrisma.lead.updateMany.mockResolvedValue({ count: 2 });

      const res = await service.bulkAssignLeadsToPreSales({
        leadIds: ['l-1', 'l-2'],
      });

      expect(res.success).toBe(true);
      expect(res.totalProcessed).toBe(2);
      expect(res.assignedCount).toBe(2);
      expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['l-1', 'l-2'] } },
        data: {
          assignedUserId: null,
          status: 'NEW',
          subStatus: 'PENDING',
        },
      });
    });

    it('should find campaign leadIds from webhook logs if campaignId provided', async () => {
      mockPrisma.metaLeadWebhookLog.findMany.mockResolvedValue([
        { leadId: 'lead-camp-1' },
      ]);
      mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.bulkAssignLeadsToPreSales({
        campaignId: 'camp-100',
      });

      expect(res.success).toBe(true);
      expect(res.totalProcessed).toBe(1);
      expect(res.assignedCount).toBe(1);
    });

    it('should return 0 count if targetLeadIds is empty', async () => {
      mockPrisma.metaLeadWebhookLog.findMany.mockResolvedValue([]);

      const res = await service.bulkAssignLeadsToPreSales({
        campaignId: 'camp-empty',
      });

      expect(res.totalProcessed).toBe(0);
      expect(res.assignedCount).toBe(0);
    });
  });
});
