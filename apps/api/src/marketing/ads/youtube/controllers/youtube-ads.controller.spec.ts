import { YouTubeAdsController } from './youtube-ads.controller.js';

describe('YouTubeAdsController', () => {
  let controller: YouTubeAdsController;
  let mockYouTubeAdsService: any;

  beforeEach(() => {
    mockYouTubeAdsService = {
      getOverview: jest.fn().mockResolvedValue({
        kpis: { totalViews: 50000 },
        items: [{ id: 'yt-camp-1' }],
      }),
      getCampaignDetails: jest.fn().mockResolvedValue({
        campaign: { id: 'yt-camp-1' },
      }),
      triggerSync: jest.fn().mockResolvedValue({ success: true }),
    };

    controller = new YouTubeAdsController(mockYouTubeAdsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview using integrationId from query', async () => {
      const res = await controller.getOverview({ integrationId: 'g-int-1' });
      expect(mockYouTubeAdsService.getOverview).toHaveBeenCalledWith('g-int-1');
      expect(res.kpis.totalViews).toBe(50000);
    });
  });

  describe('getCampaigns', () => {
    it('should return overview items using integrationId from query', async () => {
      const res = await controller.getCampaigns({ integrationId: 'g-int-1' });
      expect(mockYouTubeAdsService.getOverview).toHaveBeenCalledWith('g-int-1');
      expect(res.items.length).toBe(1);
    });
  });

  describe('getCampaignDetails', () => {
    it('should return campaign details by id', async () => {
      const res = await controller.getCampaignDetails('yt-camp-1');
      expect(mockYouTubeAdsService.getCampaignDetails).toHaveBeenCalledWith(
        'yt-camp-1',
      );
      expect(res.campaign.id).toBe('yt-camp-1');
    });
  });

  describe('syncIntegration', () => {
    it('should call triggerSync with id and datePreset', async () => {
      const res = await controller.syncIntegration('g-int-1', {
        datePreset: 'last_30d',
      });
      expect(mockYouTubeAdsService.triggerSync).toHaveBeenCalledWith(
        'g-int-1',
        'last_30d',
      );
      expect(res.success).toBe(true);
    });
  });
});
