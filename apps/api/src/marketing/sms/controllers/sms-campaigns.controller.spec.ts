import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn().mockReturnValue(1),
}));

import { SmsCampaignsController } from './sms-campaigns.controller.js';
import { SmsService } from '../sms.service.js';

describe('SmsCampaignsController', () => {
  let controller: SmsCampaignsController;
  let smsService: jest.Mocked<Partial<SmsService>>;

  beforeEach(async () => {
    smsService = {
      getProjects: jest.fn().mockResolvedValue([{ id: 'p-1' }]),
      calculateCostEstimate: jest.fn().mockResolvedValue({ cost: 200 }),
      previewAudience: jest.fn().mockResolvedValue({ finalAudienceCount: 80 }),
      saveDraftCampaign: jest.fn().mockResolvedValue({ id: 'draft-1' }),
      createCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      findAllCampaigns: jest.fn().mockResolvedValue([{ id: 'camp-1' }]),
      findOneCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      deleteCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      getCampaignAnalytics: jest.fn().mockResolvedValue({ delivered: 50 }),
      getCampaignRecipients: jest.fn().mockResolvedValue([]),
      sendTestSms: jest.fn().mockResolvedValue({ success: true }),
      dispatchCampaign: jest.fn().mockResolvedValue({ dispatched: true }),
      bulkAssignRecipientsToCrm: jest.fn().mockResolvedValue({ assigned: 3 }),
      getExportLeadsData: jest.fn().mockResolvedValue([]),
      promoteCsvRecipientToLead: jest.fn().mockResolvedValue({ id: 'lead-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsCampaignsController],
      providers: [{ provide: SmsService, useValue: smsService }],
    }).compile();

    controller = module.get<SmsCampaignsController>(SmsCampaignsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());
  it('getProjects ? delegates', async () => {
    await controller.getProjects();
    expect(smsService.getProjects).toHaveBeenCalled();
  });
  it('calculateCostEstimate ? delegates dto', async () => {
    await controller.calculateCostEstimate({ recipientCount: 100 } as any);
    expect(smsService.calculateCostEstimate).toHaveBeenCalled();
  });
  it('previewAudience ? delegates dto', async () => {
    const res = await controller.previewAudience({
      audienceSource: 'CRM_DATABASE',
    } as any);
    expect(res.finalAudienceCount).toBe(80);
  });
  it('saveDraft ? passes userId from req', async () => {
    await controller.saveDraft({ subject: 'x' } as any, {
      user: { id: 'u-1' },
    });
    expect(smsService.saveDraftCampaign).toHaveBeenCalledWith(
      { subject: 'x' },
      'u-1',
    );
  });
  it('createCampaign ? passes userId from req', async () => {
    await controller.createCampaign({ message: 'Hi' } as any, {
      user: { id: 'u-1' },
    });
    expect(smsService.createCampaign).toHaveBeenCalledWith(
      { message: 'Hi' },
      'u-1',
    );
  });
  it('findAll ? wraps result in items/total', async () => {
    const res = await controller.findAll({});
    expect(res).toHaveProperty('items');
    expect(res).toHaveProperty('total');
  });
  it('findOne ? delegates id', async () => {
    await controller.findOne('camp-1');
    expect(smsService.findOneCampaign).toHaveBeenCalledWith('camp-1');
  });
  it('delete ? delegates id', async () => {
    await controller.delete('camp-1');
    expect(smsService.deleteCampaign).toHaveBeenCalledWith('camp-1');
  });
  it('getAnalytics ? delegates id', async () => {
    await controller.getAnalytics('camp-1');
    expect(smsService.getCampaignAnalytics).toHaveBeenCalledWith('camp-1');
  });
  it('getRecipients ? delegates id and query', async () => {
    await controller.getRecipients('camp-1', {});
    expect(smsService.getCampaignRecipients).toHaveBeenCalledWith('camp-1', {});
  });
  it('sendTestSms ? delegates dto', async () => {
    const res = await controller.sendTestSms({ phone: '+91...' } as any);
    expect(res.success).toBe(true);
  });
  it('dispatchCampaign ? delegates id', async () => {
    await controller.dispatchCampaign('camp-1');
    expect(smsService.dispatchCampaign).toHaveBeenCalledWith('camp-1');
  });
  it('bulkAssignLeads ? delegates dto and userId', async () => {
    await controller.bulkAssignLeads(
      { user: { id: 'u-1' } },
      {
        recipientIds: [],
      },
    );
    expect(smsService.bulkAssignRecipientsToCrm).toHaveBeenCalled();
  });
  it('exportLeadsData ? delegates dto', async () => {
    await controller.exportLeadsData({ campaignId: 'c-1' } as any);
    expect(smsService.getExportLeadsData).toHaveBeenCalled();
  });
  it('promoteRecipient ? delegates id and userId', async () => {
    await controller.promoteRecipient('r-1', { user: { id: 'u-1' } });
    expect(smsService.promoteCsvRecipientToLead).toHaveBeenCalledWith(
      'r-1',
      'u-1',
    );
  });
});
