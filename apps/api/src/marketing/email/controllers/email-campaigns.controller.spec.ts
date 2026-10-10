import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { EmailCampaignsController } from './email-campaigns.controller.js';
import { EmailService } from '../email.service.js';

describe('EmailCampaignsController', () => {
  let controller: EmailCampaignsController;
  let emailService: jest.Mocked<Partial<EmailService>>;

  beforeEach(async () => {
    emailService = {
      getProjects: jest
        .fn()
        .mockResolvedValue([{ id: 'p-1', name: 'Skyline' }]),
      calculateCostEstimate: jest
        .fn()
        .mockResolvedValue({ estimatedCost: 100 }),
      previewAudience: jest.fn().mockResolvedValue({ finalAudienceCount: 50 }),
      findAllCampaigns: jest.fn().mockResolvedValue([]),
      saveDraftCampaign: jest.fn().mockResolvedValue({ id: 'draft-1' }),
      createCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      findOneCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      deleteCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
      getCampaignAnalytics: jest.fn().mockResolvedValue({ opens: 10 }),
      getCampaignRecipients: jest.fn().mockResolvedValue([]),
      sendTestEmail: jest.fn().mockResolvedValue({ success: true }),
      dispatchCampaign: jest.fn().mockResolvedValue({ dispatched: true }),
      bulkAssignRecipientsToCrm: jest.fn().mockResolvedValue({ assigned: 5 }),
      getExportLeadsData: jest.fn().mockResolvedValue([]),
      promoteCsvRecipientToLead: jest.fn().mockResolvedValue({ id: 'lead-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailCampaignsController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get<EmailCampaignsController>(EmailCampaignsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getProjects ? delegates to emailService.getProjects', async () => {
    const res = await controller.getProjects();
    expect(emailService.getProjects).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'p-1', name: 'Skyline' }]);
  });

  it('calculateCostEstimate ? delegates with dto', async () => {
    const dto = { recipientCount: 1000 } as any;
    const res = await controller.calculateCostEstimate(dto);
    expect(emailService.calculateCostEstimate).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ estimatedCost: 100 });
  });

  it('previewAudience ? delegates with dto', async () => {
    const dto = { audienceSource: 'CRM_DATABASE' } as any;
    const res = await controller.previewAudience(dto);
    expect(emailService.previewAudience).toHaveBeenCalledWith(dto);
    expect(res.finalAudienceCount).toBe(50);
  });

  it('findAll ? delegates with query', async () => {
    const res = await controller.findAll({ page: 1, limit: 10 });
    expect(emailService.findAllCampaigns).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(res).toEqual([]);
  });

  it('saveDraft ? passes userId from req.user', async () => {
    const req = { user: { id: 'u-1' } };
    const dto = { subject: 'Hello' } as any;
    const res = await controller.saveDraft(req, dto);
    expect(emailService.saveDraftCampaign).toHaveBeenCalledWith(dto, 'u-1');
    expect(res).toEqual({ id: 'draft-1' });
  });

  it('create ? passes userId from req.user', async () => {
    const req = { user: { id: 'u-1' } };
    const dto = { subject: 'Campaign' } as any;
    const res = await controller.create(req, dto);
    expect(emailService.createCampaign).toHaveBeenCalledWith(dto, 'u-1');
    expect(res).toEqual({ id: 'camp-1' });
  });

  it('findOne ? delegates with id', async () => {
    const res = await controller.findOne('camp-1');
    expect(emailService.findOneCampaign).toHaveBeenCalledWith('camp-1');
    expect(res).toEqual({ id: 'camp-1' });
  });

  it('delete ? delegates with id', async () => {
    await controller.delete('camp-1');
    expect(emailService.deleteCampaign).toHaveBeenCalledWith('camp-1');
  });

  it('getAnalytics ? delegates with id', async () => {
    const res = await controller.getAnalytics('camp-1');
    expect(emailService.getCampaignAnalytics).toHaveBeenCalledWith('camp-1');
    expect(res).toEqual({ opens: 10 });
  });

  it('getRecipients ? delegates id and query', async () => {
    await controller.getRecipients('camp-1', { status: 'SENT' });
    expect(emailService.getCampaignRecipients).toHaveBeenCalledWith('camp-1', {
      status: 'SENT',
    });
  });

  it('sendTestEmail ? delegates dto', async () => {
    const dto = { recipientEmail: 'test@x.com' } as any;
    const res = await controller.sendTestEmail(dto);
    expect(emailService.sendTestEmail).toHaveBeenCalledWith(dto);
    expect(res.success).toBe(true);
  });

  it('dispatchCampaign ? delegates with id', async () => {
    const res = await controller.dispatchCampaign('camp-1');
    expect(emailService.dispatchCampaign).toHaveBeenCalledWith('camp-1');
    expect(res).toEqual({ dispatched: true });
  });

  it('bulkAssignLeads ? passes userId from req.user', async () => {
    const req = { user: { id: 'u-1' } };
    const dto = { recipientIds: ['r-1'] } as any;
    await controller.bulkAssignLeads(req, dto);
    expect(emailService.bulkAssignRecipientsToCrm).toHaveBeenCalledWith(
      dto,
      'u-1',
    );
  });

  it('exportLeadsData ? delegates dto', async () => {
    const dto = { campaignId: 'camp-1' } as any;
    await controller.exportLeadsData(dto);
    expect(emailService.getExportLeadsData).toHaveBeenCalledWith(dto);
  });

  it('promoteRecipient ? delegates recipientId and userId', async () => {
    const req = { user: { id: 'u-1' } };
    await controller.promoteRecipient(req, 'r-1');
    expect(emailService.promoteCsvRecipientToLead).toHaveBeenCalledWith(
      'r-1',
      'u-1',
    );
  });
});
