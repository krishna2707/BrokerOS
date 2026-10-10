import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAdsController } from './google-ads.controller.js';
import { GoogleAdsService } from '../services/google-ads.service.js';

describe('GoogleAdsController', () => {
  let controller: GoogleAdsController;
  let service: jest.Mocked<Partial<GoogleAdsService>>;

  beforeEach(async () => {
    service = {
      getOAuthUrl: jest
        .fn()
        .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?...'),
      handleOAuthCallback: jest.fn().mockResolvedValue({ success: true }),
      testConnection: jest.fn().mockResolvedValue({ valid: true }),
      listIntegrations: jest.fn().mockResolvedValue([]),
      connectIntegration: jest.fn().mockResolvedValue({ id: 'g-int-1' }),
      deleteIntegration: jest.fn().mockResolvedValue({ id: 'g-int-1' }),
      triggerSync: jest.fn().mockResolvedValue({ synced: true }),
      getCampaigns: jest.fn().mockResolvedValue([]),
      getCampaignDetails: jest.fn().mockResolvedValue({ id: 'g-camp-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAdsController],
      providers: [{ provide: GoogleAdsService, useValue: service }],
    }).compile();

    controller = module.get<GoogleAdsController>(GoogleAdsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getOAuthUrl ? returns authorization url', () => {
    const res = controller.getOAuthUrl({
      redirectUri: 'http://localhost/cb',
      state: 'xyz',
    });
    expect(service.getOAuthUrl).toHaveBeenCalledWith(
      'http://localhost/cb',
      'xyz',
    );
    expect(res.url).toContain('https://accounts.google.com');
  });

  it('handleOAuthCallback ? delegates to service', async () => {
    const dto = { code: 'auth-code', redirectUri: 'http://localhost/cb' };
    const res = await controller.handleOAuthCallback(dto);
    expect(service.handleOAuthCallback).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ success: true });
  });

  it('testConnection ? delegates dto', async () => {
    const dto = {
      developerToken: 'dev-token',
      refreshToken: 'ref-token',
    } as any;
    const res = await controller.testConnection(dto);
    expect(service.testConnection).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ valid: true });
  });

  it('listIntegrations ? returns connected google accounts', async () => {
    const res = await controller.listIntegrations();
    expect(service.listIntegrations).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('connectIntegration ? delegates dto', async () => {
    const dto = { customerId: '123-456-7890' } as any;
    const res = await controller.connectIntegration(dto);
    expect(service.connectIntegration).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'g-int-1' });
  });

  it('deleteIntegration ? delegates id', async () => {
    const res = await controller.deleteIntegration('g-int-1');
    expect(service.deleteIntegration).toHaveBeenCalledWith('g-int-1');
    expect(res).toEqual({ id: 'g-int-1' });
  });

  it('syncIntegration ? delegates id and preset', async () => {
    const res = await controller.syncIntegration('g-int-1', {
      datePreset: 'LAST_30_DAYS',
    });
    expect(service.triggerSync).toHaveBeenCalledWith('g-int-1', 'LAST_30_DAYS');
    expect(res).toEqual({ synced: true });
  });

  it('getCampaigns ? delegates integrationId', async () => {
    const res = await controller.getCampaigns('g-int-1');
    expect(service.getCampaigns).toHaveBeenCalledWith('g-int-1');
    expect(res).toEqual([]);
  });

  it('getCampaignDetails ? delegates id', async () => {
    const res = await controller.getCampaignDetails('g-camp-1');
    expect(service.getCampaignDetails).toHaveBeenCalledWith('g-camp-1');
    expect(res).toEqual({ id: 'g-camp-1' });
  });
});
