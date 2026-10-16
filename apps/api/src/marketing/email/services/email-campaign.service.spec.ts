jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { EmailCampaignService } from './email-campaign.service.js';

describe('EmailCampaignService', () => {
  let service: EmailCampaignService;
  let mockAudienceService: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockAudienceService = {
      previewAudience: jest.fn().mockResolvedValue({ finalAudienceCount: 2 }),
      buildLeadWhereClause: jest.fn().mockReturnValue({}),
      partitionAudienceAcrossPools: jest.fn().mockReturnValue({
        allocations: [{ count: 2, weight: 100 }],
        partitionedRecipients: [],
      }),
    };

    mockPrisma = {
      project: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p-1', name: 'Skyline' }]),
        findUnique: jest.fn().mockResolvedValue({ id: 'p-1' }),
      },
      emailTemplate: {
        findUnique: jest.fn().mockResolvedValue({ id: 't-1' }),
      },
      marketingIntegration: {
        findUnique: jest.fn().mockResolvedValue({ id: 'int-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'int-1' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u-1' }),
      },
      marketingCampaign: {
        create: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Test Camp' }),
        update: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Updated Camp' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Test Camp' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue({ id: 'c-1' }),
      },
      marketingUnsubscribe: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      campaignRecipient: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      campaignSenderPool: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'pool-1' }),
      },
      emailTrackingEvent: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    service = new EmailCampaignService(mockPrisma, mockAudienceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getProjects should return active projects', async () => {
    const projects = await service.getProjects();
    expect(mockPrisma.project.findMany).toHaveBeenCalled();
    expect(projects).toEqual([{ id: 'p-1', name: 'Skyline' }]);
  });

  it('resolveForeignKeys should validate foreign keys against database', async () => {
    const fks = await service.resolveForeignKeys(
      { templateId: 't-1', projectId: 'p-1', integrationId: 'int-1' },
      'u-1',
    );
    expect(fks).toEqual({
      templateId: 't-1',
      projectId: 'p-1',
      integrationId: 'int-1',
      userId: 'u-1',
    });
  });

  it('saveDraftCampaign should create draft campaign in database', async () => {
    const draft = await service.saveDraftCampaign({
      title: 'Draft Campaign',
      channel: 'EMAIL',
    });
    expect(mockPrisma.marketingCampaign.create).toHaveBeenCalled();
    expect(draft.id).toBe('c-1');
  });

  it('deleteCampaign should delete recipients, tracking events, and campaign', async () => {
    const res = await service.deleteCampaign('c-1');
    expect(mockPrisma.emailTrackingEvent.deleteMany).toHaveBeenCalledWith({
      where: { campaignId: 'c-1' },
    });
    expect(mockPrisma.campaignRecipient.deleteMany).toHaveBeenCalledWith({
      where: { campaignId: 'c-1' },
    });
    expect(mockPrisma.marketingCampaign.delete).toHaveBeenCalledWith({
      where: { id: 'c-1' },
    });
    expect(res.success).toBe(true);
  });
});
