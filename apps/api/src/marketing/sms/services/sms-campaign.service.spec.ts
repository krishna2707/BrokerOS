jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { SmsCampaignService } from './sms-campaign.service.js';

describe('SmsCampaignService', () => {
  let service: SmsCampaignService;
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
      smsIntegration: {
        findUnique: jest.fn().mockResolvedValue({ id: 'int-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'int-1' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u-1' }),
      },
      smsCampaign: {
        create: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Test Camp' }),
        update: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Updated Camp' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'c-1', title: 'Test Camp' }),
        findMany: jest.fn().mockResolvedValue([{ id: 'c-1', title: 'Test Camp' }]),
        count: jest.fn().mockResolvedValue(1),
        delete: jest.fn().mockResolvedValue({ id: 'c-1' }),
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      smsRecipient: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      campaignSmsSenderPool: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'pool-1' }),
      },
    };

    service = new SmsCampaignService(mockPrisma, mockAudienceService);
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
      { projectId: 'p-1', integrationId: 'int-1' },
      'u-1',
    );
    expect(fks).toEqual({
      projectId: 'p-1',
      integrationId: 'int-1',
      userId: 'u-1',
    });
  });

  it('saveDraftCampaign should create draft campaign in database', async () => {
    const draft = await service.saveDraftCampaign({
      title: 'SMS Draft',
      channel: 'SMS',
    });
    expect(mockPrisma.smsCampaign.create).toHaveBeenCalled();
    expect(draft.id).toBe('c-1');
  });

  it('deleteCampaign should delete campaign', async () => {
    const res = await service.deleteCampaign('c-1');
    expect(mockPrisma.smsCampaign.delete).toHaveBeenCalledWith({
      where: { id: 'c-1' },
    });
    expect(res).toEqual({ id: 'c-1' });
  });
});
