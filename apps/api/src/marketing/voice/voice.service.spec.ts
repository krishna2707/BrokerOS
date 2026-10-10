import { VoiceService } from './voice.service.js';

describe('VoiceService', () => {
  let service: VoiceService;
  let mockAudienceService: any;
  let mockAnalyticsService: any;
  let mockIntegrationsService: any;
  let mockAudioService: any;
  let mockTrackingService: any;
  let mockCampaignService: any;
  let mockDispatcherService: any;

  beforeEach(() => {
    mockAudienceService = {
      estimateAudience: jest
        .fn()
        .mockResolvedValue({ finalAudienceCount: 100 }),
      promoteCsvRecipientToLead: jest
        .fn()
        .mockResolvedValue({ id: 'lead-promoted' }),
    };

    mockAnalyticsService = {
      getCampaignAnalytics: jest.fn().mockResolvedValue({ completedCalls: 50 }),
      getCampaignRecipients: jest
        .fn()
        .mockResolvedValue({ items: [], total: 0 }),
      getOverallMetrics: jest.fn().mockResolvedValue({ totalCallsPlaced: 200 }),
    };

    mockIntegrationsService = {};
    mockAudioService = {};
    mockTrackingService = {};

    mockCampaignService = {
      getProjects: jest.fn().mockResolvedValue([{ id: 'p-1' }]),
      getCampaigns: jest
        .fn()
        .mockResolvedValue({ items: [{ id: 'c-1' }], total: 1 }),
      getCampaignById: jest.fn().mockResolvedValue({ id: 'c-1' }),
      saveDraftCampaign: jest.fn().mockResolvedValue({ id: 'c-draft' }),
      createCampaign: jest.fn().mockResolvedValue({ id: 'c-created' }),
      deleteCampaign: jest.fn().mockResolvedValue({ id: 'c-deleted' }),
      dispatchCampaign: jest
        .fn()
        .mockResolvedValue({ id: 'c-1', status: 'PROCESSING' }),
    };

    mockDispatcherService = {
      testCarrierLine: jest.fn().mockResolvedValue({ success: true }),
      testVoiceAiCall: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new VoiceService(
      mockAudienceService,
      mockAnalyticsService,
      mockIntegrationsService,
      mockAudioService,
      mockTrackingService,
      mockCampaignService,
      mockDispatcherService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Audience & Analytics delegations', () => {
    it('should preview audience via audienceService', async () => {
      const dto = { projectId: 'p-1' };
      const res = await service.previewAudience(dto);
      expect(mockAudienceService.estimateAudience).toHaveBeenCalledWith(dto);
      expect(res.finalAudienceCount).toBe(100);
    });

    it('should promote CSV recipient to lead', async () => {
      const res = await service.promoteCsvRecipientToLead('rec-1', 'user-1');
      expect(
        mockAudienceService.promoteCsvRecipientToLead,
      ).toHaveBeenCalledWith('rec-1', 'user-1');
      expect(res.id).toBe('lead-promoted');
    });

    it('should delegate getCampaignAnalytics', async () => {
      const res = await service.getCampaignAnalytics('c-1');
      expect(mockAnalyticsService.getCampaignAnalytics).toHaveBeenCalledWith(
        'c-1',
      );
      expect(res.completedCalls).toBe(50);
    });

    it('should delegate getCampaignRecipients', async () => {
      const query = { page: 1 };
      const res = await service.getCampaignRecipients('c-1', query);
      expect(mockAnalyticsService.getCampaignRecipients).toHaveBeenCalledWith(
        'c-1',
        query,
      );
      expect(res.items).toEqual([]);
    });
  });

  describe('Campaign delegations', () => {
    it('should delegate findOneCampaign & getCampaignById', async () => {
      await service.findOneCampaign('c-1');
      await service.getCampaignById('c-1');
      expect(mockCampaignService.getCampaignById).toHaveBeenCalledTimes(2);
    });

    it('should delegate findAllCampaigns & getCampaigns', async () => {
      await service.findAllCampaigns({ page: 1 });
      await service.getCampaigns({ page: 1 });
      expect(mockCampaignService.getCampaigns).toHaveBeenCalledTimes(2);
    });

    it('should delegate getProjects', async () => {
      const res = await service.getProjects();
      expect(mockCampaignService.getProjects).toHaveBeenCalled();
      expect(res.length).toBe(1);
    });

    it('should delegate saveDraftCampaign', async () => {
      const dto: any = { name: 'Draft' };
      const res = await service.saveDraftCampaign(dto, 'u-1', 'c-old');
      expect(mockCampaignService.saveDraftCampaign).toHaveBeenCalledWith(
        dto,
        'u-1',
        'c-old',
      );
      expect(res.id).toBe('c-draft');
    });

    it('should delegate createCampaign', async () => {
      const dto: any = { name: 'New' };
      const res = await service.createCampaign(dto, 'u-1');
      expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(
        dto,
        'u-1',
      );
      expect(res.id).toBe('c-created');
    });

    it('should delegate deleteCampaign', async () => {
      const res = await service.deleteCampaign('c-1');
      expect(mockCampaignService.deleteCampaign).toHaveBeenCalledWith('c-1');
      expect(res.id).toBe('c-deleted');
    });

    it('should delegate dispatchCampaign', async () => {
      const res = await service.dispatchCampaign('c-1');
      expect(mockCampaignService.dispatchCampaign).toHaveBeenCalledWith('c-1');
      expect(res.status).toBe('PROCESSING');
    });
  });

  describe('Dispatcher delegations', () => {
    it('should delegate testCarrierLine', async () => {
      const dto: any = { carrier: 'TWILIO' };
      const res = await service.testCarrierLine(dto);
      expect(mockDispatcherService.testCarrierLine).toHaveBeenCalledWith(dto);
      expect(res.success).toBe(true);
    });

    it('should delegate testVoiceAiCall', async () => {
      const dto: any = { platform: 'VAPI' };
      const res = await service.testVoiceAiCall(dto);
      expect(mockDispatcherService.testVoiceAiCall).toHaveBeenCalledWith(dto);
      expect(res.success).toBe(true);
    });
  });
});
