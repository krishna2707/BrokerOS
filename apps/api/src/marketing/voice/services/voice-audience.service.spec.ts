import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VoiceAudienceService } from './voice-audience.service.js';

describe('VoiceAudienceService', () => {
  let service: VoiceAudienceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      voiceRecipient: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      note: {
        create: jest.fn(),
      },
      callRecord: {
        create: jest.fn(),
      },
    };

    service = new VoiceAudienceService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePhoneNumber', () => {
    it('should format 10 digit Indian number with +91', () => {
      const res = VoiceAudienceService.normalizePhoneNumber('9876543210');
      expect(res).toBe('+919876543210');
    });

    it('should format 12 digit number starting with 91 with +', () => {
      const res = VoiceAudienceService.normalizePhoneNumber('919876543210');
      expect(res).toBe('+919876543210');
    });

    it('should keep already formatted E.164 number', () => {
      const res = VoiceAudienceService.normalizePhoneNumber('+14155552671');
      expect(res).toBe('+14155552671');
    });

    it('should return empty string if invalid or empty', () => {
      expect(VoiceAudienceService.normalizePhoneNumber('')).toBe('');
    });
  });

  describe('estimateAudience', () => {
    it('should estimate CSV audience and count valid/duplicate phones', async () => {
      const dto: any = {
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [
          { phone: '9876543210' },
          { phone: '9876543210' }, // duplicate
          { phone: '9123456789' },
          { phone: '123' }, // invalid short
        ],
      };

      const res = await service.estimateAudience(dto);
      expect(res.totalCount).toBe(4);
      expect(res.validPhoneCount).toBe(2);
      expect(res.duplicateCount).toBe(1);
      expect(res.finalAudienceCount).toBe(2);
    });

    it('should return 0 counts if CSV array is empty', async () => {
      const dto: any = {
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [],
      };

      const res = await service.estimateAudience(dto);
      expect(res.totalCount).toBe(0);
      expect(res.finalAudienceCount).toBe(0);
    });

    it('should estimate CRM database audience with deduplication', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { id: 'l-1', phone: '9876543210' },
        { id: 'l-2', phone: '+919876543210' }, // duplicate normalized
        { id: 'l-3', phone: '9123456789' },
      ]);

      const dto: any = {
        audienceSource: 'CRM_DATABASE',
        audienceFilters: { statuses: ['NEW'] },
      };

      const res = await service.estimateAudience(dto);
      expect(res.totalCount).toBe(3);
      expect(res.validPhoneCount).toBe(2);
      expect(res.duplicateCount).toBe(1);
    });

    it('should merge CRM and CSV in HYBRID mode', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { id: 'l-1', phone: '9876543210' },
      ]);

      const dto: any = {
        audienceSource: 'HYBRID',
        csvRecipients: [
          { phone: '9876543210' }, // duplicate with CRM
          { phone: '9988776655' },
        ],
      };

      const res = await service.estimateAudience(dto);
      expect(res.totalCount).toBe(3); // 1 CRM + 2 CSV
      expect(res.validPhoneCount).toBe(2); // 9876543210 and 9988776655
      expect(res.duplicateCount).toBe(1);
    });
  });

  describe('resolveAudienceRecipients', () => {
    it('should resolve CSV recipients when CSV_UPLOAD', async () => {
      const dto: any = {
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [
          { phone: '9876543210', name: 'John Doe', city: 'Delhi' },
        ],
      };

      const res = await service.resolveAudienceRecipients(dto);
      expect(res.length).toBe(1);
      expect(res[0].phone).toBe('+919876543210');
      expect(res[0].name).toBe('John Doe');
      expect(res[0].source).toBe('CSV_UPLOAD');
    });

    it('should resolve CRM leads with merge data', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          firstName: 'Ankit',
          lastName: 'Sharma',
          phone: '9811122233',
          preferredLocation: 'Gurugram',
          budget: 25000000,
          temperature: 'HOT',
          status: 'QUALIFIED',
        },
      ]);

      const dto: any = {
        audienceSource: 'CRM_DATABASE',
        projectId: 'proj-1',
      };

      const res = await service.resolveAudienceRecipients(dto);
      expect(res.length).toBe(1);
      expect(res[0].phone).toBe('+919811122233');
      expect(res[0].name).toBe('Ankit Sharma');
      expect(res[0].source).toBe('CRM_DATABASE');
      expect(res[0].mergeData.budget).toBe('₹25000000');
    });
  });

  describe('promoteCsvRecipientToLead', () => {
    it('should throw NotFoundException if recipient does not exist', async () => {
      mockPrisma.voiceRecipient.findUnique.mockResolvedValue(null);

      await expect(service.promoteCsvRecipientToLead('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if recipient already linked to lead', async () => {
      mockPrisma.voiceRecipient.findUnique.mockResolvedValue({
        id: 'r-1',
        leadId: 'existing-lead',
      });

      await expect(service.promoteCsvRecipientToLead('r-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create lead, update recipient, and return lead', async () => {
      mockPrisma.voiceRecipient.findUnique.mockResolvedValue({
        id: 'r-1',
        name: 'Rohan Gupta',
        phone: '+919999988888',
        campaign: { projectId: 'proj-100' },
        mergeData: { budget: 15000000, temperature: 'HOT' },
      });

      mockPrisma.lead.create.mockResolvedValue({
        id: 'new-lead-id',
        firstName: 'Rohan',
        lastName: 'Gupta',
      });
      mockPrisma.voiceRecipient.update.mockResolvedValue({ id: 'r-1' });

      const res = await service.promoteCsvRecipientToLead('r-1', 'user-1');

      expect(res.id).toBe('new-lead-id');
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Rohan',
            lastName: 'Gupta',
            phone: '+919999988888',
            budget: 15000000,
            interestedProjectId: 'proj-100',
            createdById: 'user-1',
          }),
        }),
      );
      expect(mockPrisma.voiceRecipient.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { leadId: 'new-lead-id' },
      });
    });
  });

  describe('bulkAssignRecipientsToCrm', () => {
    it('should return 0 count if no recipients match criteria', async () => {
      mockPrisma.voiceRecipient.findMany.mockResolvedValue([]);

      const res = await service.bulkAssignRecipientsToCrm({
        campaignId: 'c-1',
      });
      expect(res.count).toBe(0);
      expect(res.message).toContain('No recipients matched');
    });

    it('should route recipients to CRM, create notes, and create call records', async () => {
      mockPrisma.voiceRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          phone: '+919876543210',
          name: 'Pooja Verma',
          sentiment: 'POSITIVE',
          disposition: 'COMPLETED',
          callDurationSec: 90,
          summary: 'High interest in 3BHK',
          recordingUrl: 'https://cdn/rec1.mp3',
          transcript: 'Turn 1: hello',
          leadId: null,
          campaign: { title: 'Festive Launch Campaign', projectId: 'p-1' },
          mergeData: { budget: '9000000' },
        },
      ]);

      mockPrisma.lead.create.mockResolvedValue({ id: 'crm-lead-created' });
      mockPrisma.voiceRecipient.update.mockResolvedValue({ id: 'rec-1' });
      mockPrisma.note.create.mockResolvedValue({ id: 'n-1' });
      mockPrisma.callRecord.create.mockResolvedValue({ id: 'cr-1' });

      const res = await service.bulkAssignRecipientsToCrm(
        { campaignId: 'c-1' },
        'admin-user-id',
      );

      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
      expect(mockPrisma.lead.create).toHaveBeenCalled();
      expect(mockPrisma.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'crm-lead-created',
            noteType: 'AI_VOICE_CAMPAIGN',
            content: expect.stringContaining('High interest in 3BHK'),
          }),
        }),
      );
      expect(mockPrisma.callRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'crm-lead-created',
            direction: 'OUTBOUND',
            status: 'CONNECTED',
            duration: 90,
          }),
        }),
      );
    });
  });

  describe('getExportLeadsData', () => {
    it('should format recipient rows for export', async () => {
      mockPrisma.voiceRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          phone: '+919876543210',
          name: 'Vikas',
          status: 'COMPLETED',
          disposition: 'COMPLETED',
          callDurationSec: 45,
          sentiment: 'POSITIVE',
          summary: 'Interested',
          recordingUrl: 'https://url',
          transcript: 'Transcript text',
          leadId: 'lead-1',
          completedAt: new Date('2026-03-01'),
          lead: { firstName: 'Vikas', lastName: 'Mehra' },
        },
      ]);

      const res = await service.getExportLeadsData({ campaignId: 'c-1' });
      expect(res.campaignId).toBe('c-1');
      expect(res.totalCount).toBe(1);
      expect(res.rows[0].name).toBe('Vikas Mehra');
      expect(res.rows[0].mappedTemperature).toBe('HOT');
    });
  });
});
