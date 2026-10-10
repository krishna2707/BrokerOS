import { InstagramAdsController } from './instagram-ads.controller.js';

describe('InstagramAdsController', () => {
  let controller: InstagramAdsController;
  let mockInstagramAdsService: any;

  beforeEach(() => {
    mockInstagramAdsService = {
      getOverview: jest.fn().mockResolvedValue({
        items: [{ id: 'ig-camp-1' }],
        kpis: { totalSpend: 5000 },
        placementBreakdown: { reels: {} },
      }),
      getCampaignDetails: jest.fn().mockResolvedValue({
        campaign: { id: 'ig-camp-1' },
        creatives: [],
      }),
      triggerSync: jest.fn().mockResolvedValue({ success: true }),
    };

    controller = new InstagramAdsController(mockInstagramAdsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview data from service', async () => {
      const res = await controller.getOverview('int-1');
      expect(mockInstagramAdsService.getOverview).toHaveBeenCalledWith('int-1');
      expect(res.kpis.totalSpend).toBe(5000);
    });
  });

  describe('getCampaigns', () => {
    it('should extract items, kpis, and placementBreakdown from overview', async () => {
      const res = await controller.getCampaigns('int-1');
      expect(mockInstagramAdsService.getOverview).toHaveBeenCalledWith('int-1');
      expect(res.items.length).toBe(1);
      expect(res.kpis.totalSpend).toBe(5000);
      expect(res.placementBreakdown).toBeDefined();
    });
  });

  describe('getCampaignDetails', () => {
    it('should return campaign details by id', async () => {
      const res = await controller.getCampaignDetails('ig-camp-1');
      expect(mockInstagramAdsService.getCampaignDetails).toHaveBeenCalledWith(
        'ig-camp-1',
      );
      expect(res.campaign.id).toBe('ig-camp-1');
    });
  });

  describe('triggerSync', () => {
    it('should trigger sync with optional integrationId and datePreset', async () => {
      const res = await controller.triggerSync('int-1', {
        datePreset: 'last_14d',
      });
      expect(mockInstagramAdsService.triggerSync).toHaveBeenCalledWith(
        'int-1',
        'last_14d',
      );
      expect(res.success).toBe(true);
    });
  });
});
