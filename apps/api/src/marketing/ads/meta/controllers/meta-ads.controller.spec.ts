import { MetaAdsController } from './meta-ads.controller.js';

describe('MetaAdsController', () => {
  let controller: MetaAdsController;
  let mockMetaAdsService: any;

  beforeEach(() => {
    mockMetaAdsService = {
      listIntegrations: jest.fn().mockResolvedValue([]),
      connectIntegration: jest.fn().mockResolvedValue({ id: 'meta-1' }),
      deleteIntegration: jest.fn().mockResolvedValue({ id: 'meta-1' }),
      triggerSync: jest.fn().mockResolvedValue({ success: true }),
      testConnection: jest.fn().mockResolvedValue({ success: true }),
      getCampaigns: jest.fn().mockResolvedValue({ kpis: {}, items: [] }),
      getCampaignDetails: jest
        .fn()
        .mockResolvedValue({ campaign: { id: 'c-1' } }),
      bulkAssignLeadsToPreSales: jest
        .fn()
        .mockResolvedValue({ success: true, assignedCount: 5 }),
    };

    controller = new MetaAdsController(mockMetaAdsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listIntegrations', () => {
    it('should call listIntegrations on service', async () => {
      const res = await controller.listIntegrations();
      expect(mockMetaAdsService.listIntegrations).toHaveBeenCalled();
      expect(res).toEqual([]);
    });
  });

  describe('connectIntegration', () => {
    it('should connect integration with dto', async () => {
      const dto: any = { adAccountId: 'act_123', accessToken: 'token_abc' };
      const res = await controller.connectIntegration(dto);
      expect(mockMetaAdsService.connectIntegration).toHaveBeenCalledWith(dto);
      expect(res.id).toBe('meta-1');
    });
  });

  describe('deleteIntegration', () => {
    it('should delete integration by id', async () => {
      const res = await controller.deleteIntegration('meta-1');
      expect(mockMetaAdsService.deleteIntegration).toHaveBeenCalledWith(
        'meta-1',
      );
      expect(res.id).toBe('meta-1');
    });
  });

  describe('syncIntegration', () => {
    it('should trigger sync on service', async () => {
      const dto: any = { datePreset: 'last_30d' };
      const res = await controller.syncIntegration('meta-1', dto);
      expect(mockMetaAdsService.triggerSync).toHaveBeenCalledWith(
        'meta-1',
        'last_30d',
      );
      expect(res.success).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should test connection with credentials', async () => {
      const dto: any = { adAccountId: 'act_123', accessToken: 'token_abc' };
      const res = await controller.testConnection(dto);
      expect(mockMetaAdsService.testConnection).toHaveBeenCalledWith(dto);
      expect(res.success).toBe(true);
    });
  });

  describe('getCampaigns', () => {
    it('should get campaigns with optional integrationId', async () => {
      const res = await controller.getCampaigns('meta-1');
      expect(mockMetaAdsService.getCampaigns).toHaveBeenCalledWith('meta-1');
      expect(res.items).toEqual([]);
    });
  });

  describe('getCampaignDetails', () => {
    it('should get campaign details by id', async () => {
      const res = await controller.getCampaignDetails('c-1');
      expect(mockMetaAdsService.getCampaignDetails).toHaveBeenCalledWith('c-1');
      expect(res.campaign.id).toBe('c-1');
    });
  });

  describe('bulkAssignLeads', () => {
    it('should call bulkAssignLeadsToPreSales with dto', async () => {
      const dto: any = { leadIds: ['l-1', 'l-2'] };
      const res = await controller.bulkAssignLeads(dto);
      expect(mockMetaAdsService.bulkAssignLeadsToPreSales).toHaveBeenCalledWith(
        dto,
      );
      expect(res.assignedCount).toBe(5);
    });
  });

  describe('bulkAssignCampaignLeads', () => {
    it('should inject campaignId into bulkAssignLeadsToPreSales call', async () => {
      const dto: any = { leadIds: [] };
      const res = await controller.bulkAssignCampaignLeads('c-100', dto);
      expect(mockMetaAdsService.bulkAssignLeadsToPreSales).toHaveBeenCalledWith(
        {
          ...dto,
          campaignId: 'c-100',
        },
      );
      expect(res.assignedCount).toBe(5);
    });
  });
});
