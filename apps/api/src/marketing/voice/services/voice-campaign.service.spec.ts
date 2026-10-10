import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VoiceCampaignService } from './voice-campaign.service.js';

describe('VoiceCampaignService', () => {
  let service: VoiceCampaignService;
  let mockAudienceService: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockAudienceService = {
      resolveAudienceRecipients: jest.fn(),
    };

    mockPrisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      voiceTelephonyIntegration: {
        findUnique: jest.fn(),
      },
      voiceAgentIntegration: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      voiceCampaign: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      voiceRecipient: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      voiceCallLog: {
        deleteMany: jest.fn(),
      },
      lead: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    service = new VoiceCampaignService(mockAudienceService);
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveForeignKeys', () => {
    it('should resolve project, telephony, and agent IDs from DB', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.voiceTelephonyIntegration.findUnique.mockResolvedValue({
        id: 'tel-1',
      });
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue({
        id: 'agent-1',
      });

      const res = await service.resolveForeignKeys({
        projectId: 'proj-1',
        telephonyId: 'tel-1',
        agentPlatformId: 'agent-1',
      });

      expect(res.projectId).toBe('proj-1');
      expect(res.telephonyId).toBe('tel-1');
      expect(res.agentPlatformId).toBe('agent-1');
    });

    it('should fallback to first active agent integration if ID not found directly', async () => {
      mockPrisma.voiceAgentIntegration.findUnique.mockResolvedValue(null);
      mockPrisma.voiceAgentIntegration.findFirst.mockResolvedValue({
        id: 'agent-fallback',
      });

      const res = await service.resolveForeignKeys({
        agentPlatformId: 'vapi',
      });

      expect(res.agentPlatformId).toBe('agent-fallback');
    });
  });

  describe('getProjects', () => {
    it('should return active projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p-1', name: 'Project 1' },
      ]);

      const res = await service.getProjects();
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('p-1');
    });
  });

  describe('getCampaigns', () => {
    it('should query campaigns with filters and pagination', async () => {
      mockPrisma.voiceCampaign.findMany.mockResolvedValue([{ id: 'c-1' }]);
      mockPrisma.voiceCampaign.count.mockResolvedValue(1);

      const res = await service.getCampaigns({
        page: 1,
        limit: 10,
        status: 'PROCESSING',
        projectId: 'p-1',
        isCpCampaign: false,
      });

      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(res.totalPages).toBe(1);
    });
  });

  describe('getCampaignById', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignById('c-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return campaign details', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Camp 1',
      });

      const res = await service.getCampaignById('c-1');
      expect(res.id).toBe('c-1');
    });
  });

  describe('saveDraftCampaign', () => {
    it('should update existing draft if campaignId provided', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue({
        id: 'c-draft-1',
        title: 'Old',
      });
      mockPrisma.voiceCampaign.update.mockResolvedValue({
        id: 'c-draft-1',
        title: 'New',
      });

      const res = await service.saveDraftCampaign({
        campaignId: 'c-draft-1',
        title: 'New',
      });

      expect(mockPrisma.voiceCampaign.update).toHaveBeenCalled();
      expect(res.title).toBe('New');
    });

    it('should create new draft if campaignId is not provided', async () => {
      mockPrisma.voiceCampaign.create.mockResolvedValue({
        id: 'c-draft-new',
        status: 'DRAFT',
      });

      const res = await service.saveDraftCampaign({
        title: 'New Draft Campaign',
      });

      expect(mockPrisma.voiceCampaign.create).toHaveBeenCalled();
      expect(res.status).toBe('DRAFT');
    });
  });

  describe('createCampaign', () => {
    it('should throw BadRequestException if audience resolves to 0 recipients', async () => {
      mockAudienceService.resolveAudienceRecipients.mockResolvedValue([]);

      const dto: any = { title: 'Empty Audience Camp' };

      await expect(service.createCampaign(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create campaign and bulk insert recipients in transaction', async () => {
      mockAudienceService.resolveAudienceRecipients.mockResolvedValue([
        { phone: '+919876543210', name: 'Raj', source: 'CRM_DATABASE' },
      ]);
      mockPrisma.voiceCampaign.create.mockResolvedValue({
        id: 'camp-created-1',
        status: 'PROCESSING',
      });
      mockPrisma.voiceRecipient.createMany.mockResolvedValue({ count: 1 });

      const dto: any = {
        title: 'Full Outbound Voice Campaign',
        llmModel: 'gpt-4o',
        voiceProvider: '11labs',
        voiceId: 'voice-rachel',
        scriptPrompt: 'You are an agent.',
      };

      const res = await service.createCampaign(dto, 'u-1');

      expect(res.id).toBe('camp-created-1');
      expect(mockPrisma.voiceRecipient.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            campaignId: 'camp-created-1',
            phone: '+919876543210',
            name: 'Raj',
            status: 'QUEUED',
          }),
        ],
      });
    });
  });

  describe('deleteCampaign', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue(null);

      await expect(service.deleteCampaign('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete recipients, callLogs, and campaign in transaction', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue({ id: 'c-del' });
      mockPrisma.voiceRecipient.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.voiceCallLog.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.voiceCampaign.delete.mockResolvedValue({ id: 'c-del' });

      const res = await service.deleteCampaign('c-del');
      expect(res.id).toBe('c-del');
      expect(mockPrisma.voiceRecipient.deleteMany).toHaveBeenCalledWith({
        where: { campaignId: 'c-del' },
      });
      expect(mockPrisma.voiceCampaign.delete).toHaveBeenCalledWith({
        where: { id: 'c-del' },
      });
    });
  });

  describe('dispatchCampaign', () => {
    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue(null);

      await expect(service.dispatchCampaign('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update status to PROCESSING', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue({ id: 'c-disp' });
      mockPrisma.voiceCampaign.update.mockResolvedValue({
        id: 'c-disp',
        status: 'PROCESSING',
      });

      const res = await service.dispatchCampaign('c-disp');
      expect(res.status).toBe('PROCESSING');
    });
  });

  describe('calculateCostEstimate', () => {
    it('should return estimated cost calculation', () => {
      const res = service.calculateCostEstimate({
        telephonyCarrier: 'TWILIO',
        agentPlatform: 'VAPI',
        recipientCount: 100,
        expectedDurationSeconds: 120,
      });

      expect(res).toBeDefined();
      expect(res.totalLeads).toBe(100);
    });
  });
});
