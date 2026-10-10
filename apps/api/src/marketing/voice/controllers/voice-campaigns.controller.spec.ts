import { VoiceCampaignsController } from './voice-campaigns.controller.js';

describe('VoiceCampaignsController', () => {
  let controller: VoiceCampaignsController;
  let mockVoiceService: any;

  beforeEach(() => {
    mockVoiceService = {
      getProjects: jest
        .fn()
        .mockResolvedValue([{ id: 'p-1', name: 'Project 1' }]),
      getCampaigns: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getCampaignById: jest
        .fn()
        .mockResolvedValue({ id: 'c-1', name: 'Voice Camp' }),
      saveDraftCampaign: jest.fn().mockResolvedValue({ id: 'c-draft' }),
      createCampaign: jest.fn().mockResolvedValue({ id: 'c-created' }),
      deleteCampaign: jest.fn().mockResolvedValue({ id: 'c-deleted' }),
      dispatchCampaign: jest
        .fn()
        .mockResolvedValue({ id: 'c-1', status: 'PROCESSING' }),
      analyticsService: {
        getOverallMetrics: jest
          .fn()
          .mockResolvedValue({ totalCallsPlaced: 100 }),
        getCampaignAnalytics: jest
          .fn()
          .mockResolvedValue({ completedCalls: 80 }),
        getCampaignRecipients: jest
          .fn()
          .mockResolvedValue({ items: [], total: 0 }),
      },
      audienceService: {
        estimateAudience: jest
          .fn()
          .mockResolvedValue({ finalAudienceCount: 500 }),
        bulkAssignRecipientsToCrm: jest
          .fn()
          .mockResolvedValue({ count: 10, success: true }),
        getExportLeadsData: jest.fn().mockResolvedValue({
          totalCount: 1,
          rows: [{ phone: '+919876543210' }],
        }),
        promoteCsvRecipientToLead: jest
          .fn()
          .mockResolvedValue({ id: 'lead-promoted' }),
      },
      campaignService: {
        calculateCostEstimate: jest.fn().mockResolvedValue({
          totalLeads: 500,
          totalEstimatedCostINR: 1500,
        } as any),
      },
    };

    controller = new VoiceCampaignsController(mockVoiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjects', () => {
    it('should return projects from service', async () => {
      const res = await controller.getProjects();
      expect(mockVoiceService.getProjects).toHaveBeenCalled();
      expect(res.length).toBe(1);
    });
  });

  describe('getCampaigns', () => {
    it('should parse query params and call getCampaigns', async () => {
      await controller.getCampaigns(
        'ACTIVE',
        'p-1',
        'true',
        'search-term',
        'false',
        '2',
        '20',
      );
      expect(mockVoiceService.getCampaigns).toHaveBeenCalledWith({
        status: 'ACTIVE',
        projectId: 'p-1',
        isCpCampaign: true,
        search: 'search-term',
        includeDrafts: false,
        page: 2,
        limit: 20,
      });
    });
  });

  describe('getOverallMetrics', () => {
    it('should return metrics from analyticsService', async () => {
      const res = await controller.getOverallMetrics();
      expect(
        mockVoiceService.analyticsService.getOverallMetrics,
      ).toHaveBeenCalled();
      expect(res.totalCallsPlaced).toBe(100);
    });
  });

  describe('estimateAudience & audiencePreview', () => {
    it('should call estimateAudience on audienceService', async () => {
      const dto: any = { projectId: 'p-1' };
      const res1 = await controller.estimateAudience(dto);
      const res2 = await controller.audiencePreview(dto);
      expect(
        mockVoiceService.audienceService.estimateAudience,
      ).toHaveBeenCalledTimes(2);
      expect(res1.finalAudienceCount).toBe(500);
      expect(res2.finalAudienceCount).toBe(500);
    });
  });

  describe('calculateCostEstimate', () => {
    it('should call campaignService.calculateCostEstimate', async () => {
      const dto: any = { recipientCount: 500 };
      const res = await controller.calculateCostEstimate(dto);
      expect(
        mockVoiceService.campaignService.calculateCostEstimate,
      ).toHaveBeenCalledWith(dto);
      expect((res as any).totalLeads).toBe(500);
    });
  });

  describe('bulkAssignLeads', () => {
    it('should pass userId and dto to audienceService.bulkAssignRecipientsToCrm', async () => {
      const dto: any = { recipientIds: ['r-1'] };
      const req: any = { user: { id: 'u-123' } };
      const res = await controller.bulkAssignLeads(dto, req);
      expect(
        mockVoiceService.audienceService.bulkAssignRecipientsToCrm,
      ).toHaveBeenCalledWith(dto, 'u-123');
      expect(res.count).toBe(10);
    });
  });

  describe('exportLeads', () => {
    it('should call audienceService.getExportLeadsData', async () => {
      const dto: any = { campaignId: 'c-1' };
      const res = await controller.exportLeads(dto);
      expect(
        mockVoiceService.audienceService.getExportLeadsData,
      ).toHaveBeenCalledWith(dto);
      expect(res.rows.length).toBe(1);
    });
  });

  describe('saveDraft', () => {
    it('should save draft with userId and existingId', async () => {
      const dto: any = { name: 'Draft 1' };
      const req: any = { user: { id: 'u-admin' } };
      const res = await controller.saveDraft(dto, 'c-prev', req);
      expect(mockVoiceService.saveDraftCampaign).toHaveBeenCalledWith(
        dto,
        'u-admin',
        'c-prev',
      );
      expect(res.id).toBe('c-draft');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with userId', async () => {
      const dto: any = { name: 'Full Camp' };
      const req: any = { user: { id: 'u-admin' } };
      const res = await controller.createCampaign(dto, req);
      expect(mockVoiceService.createCampaign).toHaveBeenCalledWith(
        dto,
        'u-admin',
      );
      expect(res.id).toBe('c-created');
    });
  });

  describe('getCampaignById', () => {
    it('should get campaign by id', async () => {
      const res = await controller.getCampaignById('c-1');
      expect(mockVoiceService.getCampaignById).toHaveBeenCalledWith('c-1');
      expect(res.id).toBe('c-1');
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should get analytics by campaign id', async () => {
      const res = await controller.getCampaignAnalytics('c-1');
      expect(
        mockVoiceService.analyticsService.getCampaignAnalytics,
      ).toHaveBeenCalledWith('c-1');
      expect(res.completedCalls).toBe(80);
    });
  });

  describe('getRecipients', () => {
    it('should get campaign recipients with query', async () => {
      const query = { page: 1, limit: 10 };
      const res = await controller.getRecipients('c-1', query);
      expect(
        mockVoiceService.analyticsService.getCampaignRecipients,
      ).toHaveBeenCalledWith('c-1', query);
      expect(res.items).toEqual([]);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign by id', async () => {
      const res = await controller.deleteCampaign('c-1');
      expect(mockVoiceService.deleteCampaign).toHaveBeenCalledWith('c-1');
      expect(res.id).toBe('c-deleted');
    });
  });

  describe('dispatchCampaign', () => {
    it('should dispatch campaign by id', async () => {
      const res = await controller.dispatchCampaign('c-1');
      expect(mockVoiceService.dispatchCampaign).toHaveBeenCalledWith('c-1');
      expect(res.status).toBe('PROCESSING');
    });
  });

  describe('promoteRecipient', () => {
    it('should promote recipient to lead with userId', async () => {
      const req: any = { user: { id: 'u-agent' } };
      const res = await controller.promoteRecipient('rec-1', req);
      expect(
        mockVoiceService.audienceService.promoteCsvRecipientToLead,
      ).toHaveBeenCalledWith('rec-1', 'u-agent');
      expect(res.id).toBe('lead-promoted');
    });
  });
});
