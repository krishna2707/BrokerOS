import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class { } }));
jest.mock('expo-server-sdk', () => ({ Expo: class { } }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn().mockReturnValue(1),
}));

import { SmsService } from './sms.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { SmsAudienceService } from './services/sms-audience.service.js';
import { SmsAnalyticsService } from './services/sms-analytics.service.js';
import { SmsIntegrationsService } from './services/sms-integrations.service.js';
import { SmsTrackingService } from './services/sms-tracking.service.js';
import { SmsCampaignService } from './services/sms-campaign.service.js';

describe('SmsService (facade delegation)', () => {
  let service: SmsService;
  let audienceService: jest.Mocked<Partial<SmsAudienceService>>;
  let analyticsService: jest.Mocked<Partial<SmsAnalyticsService>>;
  let integrationsService: jest.Mocked<Partial<SmsIntegrationsService>>;
  let trackingService: jest.Mocked<Partial<SmsTrackingService>>;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      smsCampaign: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'camp-1' }),
        create: jest.fn().mockResolvedValue({ id: 'camp-1' }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      },
      smsOptOut: { findMany: jest.fn().mockResolvedValue([]) },
      lead: { findMany: jest.fn().mockResolvedValue([]) },
      campaignRecipient: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      marketingIntegration: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest
        .fn()
        .mockImplementation((fns: any) => Promise.all(fns)),
    };
    audienceService = {
      previewAudience: jest.fn().mockResolvedValue({ finalAudienceCount: 30 }),
      promoteCsvRecipientToLead: jest.fn().mockResolvedValue({ id: 'lead-1' }),
      bulkAssignRecipientsToCrm: jest.fn().mockResolvedValue({ assigned: 5 }),
      getExportLeadsData: jest.fn().mockResolvedValue([]),
    };
    analyticsService = {
      getCampaignAnalytics: jest.fn().mockResolvedValue({ sent: 100 }),
      getCampaignRecipients: jest.fn().mockResolvedValue([]),
    };
    integrationsService = {
      getAdapter: jest.fn().mockReturnValue({}),
      listIntegrations: jest.fn().mockResolvedValue([]),
      connectIntegration: jest.fn().mockResolvedValue({ id: 'int-1' }),
      deleteIntegration: jest.fn().mockResolvedValue({}),
      sendTestSms: jest.fn().mockResolvedValue({ success: true }),
    };
    trackingService = {
      processWebhookEvents: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        SmsCampaignService,
        { provide: PrismaService, useValue: prisma },
        { provide: SmsAudienceService, useValue: audienceService },
        { provide: SmsAnalyticsService, useValue: analyticsService },
        { provide: SmsIntegrationsService, useValue: integrationsService },
        { provide: SmsTrackingService, useValue: trackingService },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  it('previewAudience ? delegates to audienceService.previewAudience', async () => {
    const res = await service.previewAudience({
      audienceSource: 'CRM_DATABASE',
    } as any);
    expect(audienceService.previewAudience).toHaveBeenCalled();
    expect(res.finalAudienceCount).toBe(30);
  });

  it('promoteCsvRecipientToLead ? delegates to audienceService', async () => {
    await service.promoteCsvRecipientToLead('r-1', 'u-1');
    expect(audienceService.promoteCsvRecipientToLead).toHaveBeenCalledWith(
      'r-1',
      'u-1',
    );
  });

  it('getCampaignAnalytics ? delegates to analyticsService', async () => {
    const res = await service.getCampaignAnalytics('camp-1');
    expect(analyticsService.getCampaignAnalytics).toHaveBeenCalledWith(
      'camp-1',
    );
    expect(res).toEqual({ sent: 100 });
  });

  it('getCampaignRecipients ? delegates to analyticsService', async () => {
    await service.getCampaignRecipients('camp-1', {});
    expect(analyticsService.getCampaignRecipients).toHaveBeenCalledWith(
      'camp-1',
      {},
    );
  });

  it('findAllCampaigns ? queries prisma.smsCampaign.findMany', async () => {
    const res = await service.findAllCampaigns({});
    expect(prisma.smsCampaign.findMany).toHaveBeenCalled();
    expect(Array.isArray(res)).toBe(true);
  });

  it('findOneCampaign ? queries prisma.smsCampaign.findUnique', async () => {
    const res = await service.findOneCampaign('camp-1');
    expect(prisma.smsCampaign.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'camp-1' } }),
    );
    expect(res).toEqual({ id: 'camp-1' });
  });

  it('deleteCampaign ? queries prisma.smsCampaign.delete', async () => {
    await service.deleteCampaign('camp-1');
    expect(prisma.smsCampaign.delete).toHaveBeenCalled();
  });
});
