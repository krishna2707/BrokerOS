jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SmsAudienceService } from './sms-audience.service.js';

describe('SmsAudienceService', () => {
  let service: SmsAudienceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      smsRecipient: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      leadSource: {
        upsert: jest.fn(),
      },
    };

    service = new SmsAudienceService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('previewAudience', () => {
    it('should correctly deduplicate and validate CSV recipients', async () => {
      const res = await service.previewAudience({
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [
          {
            phone: '+919876543210',
            name: 'User 1',
            email: 'user1@example.com',
          },
          {
            phone: '+91 98765 43210',
            name: 'User 1 Duplicate',
            email: 'user1dup@example.com',
          },
          { phone: '123', name: 'Too Short', email: 'short@example.com' },
          {
            phone: '+919876543211',
            name: 'User 2',
            email: 'user2@example.com',
          },
        ],
      });

      expect(res.totalCount).toBe(4);
      expect(res.validPhoneCount).toBe(2);
      expect(res.duplicateCount).toBe(1);
      expect(res.finalAudienceCount).toBe(2);
    });

    it('should query CRM database leads with filters and deduplicate phone numbers', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { phone: '+919876543210' },
        { phone: '+91 98765 43210' },
        { phone: '+919876543212' },
      ]);

      const res = await service.previewAudience({
        audienceSource: 'CRM_DATABASE',
        audienceFilters: {
          statuses: ['INTERESTED'],
          temperatures: ['HOT'],
          projectId: 'p-1',
        },
      });

      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
      expect(res.totalCount).toBe(3);
      expect(res.validPhoneCount).toBe(2);
      expect(res.duplicateCount).toBe(1);
    });
  });

  describe('promoteCsvRecipientToLead', () => {
    it('should throw NotFoundException if recipient does not exist', async () => {
      mockPrisma.smsRecipient.findUnique.mockResolvedValue(null);

      await expect(
        service.promoteCsvRecipientToLead('rec-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should link existing lead if phone matches', async () => {
      mockPrisma.smsRecipient.findUnique.mockResolvedValue({
        id: 'rec-1',
        phone: '+919876543210',
        name: 'Existing Lead',
        campaign: { title: 'SMS Promo' },
      });
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'lead-existing',
        phone: '+919876543210',
      });
      mockPrisma.smsRecipient.update.mockResolvedValue({});

      const res = await service.promoteCsvRecipientToLead('rec-1');

      expect(mockPrisma.smsRecipient.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { leadId: 'lead-existing' },
      });
      expect(res.id).toBe('lead-existing');
    });

    it('should create new lead and dynamic lead source if no match found', async () => {
      mockPrisma.smsRecipient.findUnique.mockResolvedValue({
        id: 'rec-2',
        phone: '+919876543299',
        name: 'Ananya Roy',
        campaign: { title: 'Launch 2026', projectId: 'proj-1' },
        mergeData: { budget: 7500000 },
      });
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.leadSource.upsert.mockResolvedValue({ id: 'src-1' });
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-new',
        firstName: 'Ananya',
        lastName: 'Roy',
      });
      mockPrisma.smsRecipient.update.mockResolvedValue({});

      const res = await service.promoteCsvRecipientToLead(
        'rec-2',
        'user-admin',
      );

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Ananya',
            lastName: 'Roy',
            phone: '+919876543299',
            sourceId: 'src-1',
            createdById: 'user-admin',
          }),
        }),
      );
      expect(res.id).toBe('lead-new');
    });
  });

  describe('bulkAssignRecipientsToCrm', () => {
    it('should throw BadRequestException if neither campaignIds nor recipientIds provided', async () => {
      await expect(
        service.bulkAssignRecipientsToCrm({} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process recipients in bulk and link to existing or newly created leads', async () => {
      mockPrisma.smsRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          phone: '+919876543210',
          name: 'Existing Person',
          campaign: { title: 'Camp A', projectId: 'p-1' },
        },
        {
          id: 'rec-2',
          phone: '+919876543299',
          name: 'New Person',
          campaign: { title: 'Camp A', projectId: 'p-1' },
        },
      ]);
      mockPrisma.lead.findMany.mockResolvedValue([
        { id: 'lead-1', phone: '+919876543210' },
      ]);
      mockPrisma.leadSource.upsert.mockResolvedValue({ id: 'src-1' });
      mockPrisma.lead.create.mockResolvedValue({ id: 'lead-2' });
      mockPrisma.smsRecipient.update.mockResolvedValue({});

      const res = await service.bulkAssignRecipientsToCrm(
        { recipientIds: ['rec-1', 'rec-2'] },
        'user-1',
      );

      expect(res.success).toBe(true);
      expect(res.totalProcessed).toBe(2);
      expect(res.alreadyExisted).toBe(1);
      expect(res.newlyCreated).toBe(1);
    });
  });
});
