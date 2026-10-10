jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailAudienceService } from './email-audience.service.js';

describe('EmailAudienceService', () => {
  let service: EmailAudienceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      marketingUnsubscribe: {
        findMany: jest.fn().mockResolvedValue([{ email: 'unsub@example.com' }]),
      },
      lead: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      leadSource: {
        upsert: jest.fn(),
      },
      campaignRecipient: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new EmailAudienceService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildLeadWhereClause', () => {
    it('should build where clause with default statuses when none provided', () => {
      const clause = service.buildLeadWhereClause({});
      expect(clause.deletedAt).toBeNull();
      expect(clause.email).toEqual({ not: null });
      expect(clause.status).toEqual({
        in: ['NEW', 'CONTACTED', 'INTERESTED', 'QUALIFIED'],
      });
    });

    it('should build where clause with custom filters and CP project', () => {
      const clause = service.buildLeadWhereClause(
        {
          statuses: ['QUALIFIED', 'NEGOTIATION'],
          temperatures: ['HOT', 'WARM'],
          projectId: 'proj-123',
          minBudget: 5000000,
        },
        true,
        'proj-fallback',
      );

      expect(clause.status).toEqual({ in: ['QUALIFIED', 'NEGOTIATION'] });
      expect(clause.temperature).toEqual({ in: ['HOT', 'WARM'] });
      expect(clause.interestedProjectId).toBe('proj-123');
      expect(clause.budget).toEqual({ gte: 5000000 });
      expect(clause.brokerId).toEqual({ not: null });
    });
  });

  describe('previewAudience', () => {
    it('should preview audience from CSV upload filtering duplicates, invalid, and unsubscribed', async () => {
      const result = await service.previewAudience({
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [
          { email: 'valid1@example.com', name: 'Valid One' },
          { email: 'valid1@example.com', name: 'Duplicate' },
          { email: 'not-an-email', name: 'Invalid' },
          { email: 'unsub@example.com', name: 'Unsubscribed' },
          { email: 'valid2@example.com', name: 'Valid Two' },
        ],
      });

      expect(result.totalCount).toBe(5);
      expect(result.duplicateCount).toBe(1);
      expect(result.unsubscribedCount).toBe(1);
      expect(result.validEmailCount).toBe(2);
      expect(result.finalAudienceCount).toBe(2);
    });

    it('should preview audience from CRM leads', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { email: 'lead1@example.com' },
        { email: 'lead1@example.com' }, // duplicate
        { email: 'unsub@example.com' }, // unsubscribed
        { email: 'lead2@example.com' },
      ]);

      const result = await service.previewAudience({
        audienceSource: 'CRM_DATABASE',
        audienceFilters: { temperatures: ['HOT'] },
      });

      expect(result.totalCount).toBe(4);
      expect(result.duplicateCount).toBe(1);
      expect(result.unsubscribedCount).toBe(1);
      expect(result.validEmailCount).toBe(2);
    });
  });

  describe('promoteCsvRecipientToLead', () => {
    it('should throw NotFoundException if recipient does not exist', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue(null);

      await expect(
        service.promoteCsvRecipientToLead('rec-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing lead if recipient is already linked', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue({
        id: 'rec-1',
        leadId: 'lead-1',
        campaign: { title: 'Launch' },
      });
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        name: 'Existing Lead',
      });

      const result = await service.promoteCsvRecipientToLead('rec-1');
      expect(result.id).toBe('lead-1');
    });

    it('should link to existing lead by email/phone if found in DB', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue({
        id: 'rec-2',
        email: 'prospect@example.com',
        phone: '+919999999999',
        campaign: { title: 'Launch' },
      });
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'lead-match' });

      const result = await service.promoteCsvRecipientToLead('rec-2');

      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'rec-2' },
        data: { leadId: 'lead-match' },
      });
      expect(result.id).toBe('lead-match');
    });

    it('should create a new lead if no existing match is found', async () => {
      mockPrisma.campaignRecipient.findUnique.mockResolvedValue({
        id: 'rec-3',
        name: 'Amit Patel',
        email: 'amit@example.com',
        phone: '+919876543210',
        mergeData: { temperature: 'HOT', budget: 7500000 },
        campaign: { title: 'Skyline Launch', projectId: 'proj-1' },
      });
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.leadSource.upsert.mockResolvedValue({ id: 'source-1' });
      mockPrisma.lead.create.mockResolvedValue({ id: 'new-lead-1' });

      const result = await service.promoteCsvRecipientToLead(
        'rec-3',
        'user-admin',
      );

      expect(mockPrisma.lead.create).toHaveBeenCalled();
      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: { id: 'rec-3' },
        data: { leadId: 'new-lead-1' },
      });
      expect(result.id).toBe('new-lead-1');
    });
  });

  describe('bulkAssignRecipientsToCrm', () => {
    it('should throw BadRequestException if neither recipientIds nor campaignIds provided', async () => {
      await expect(service.bulkAssignRecipientsToCrm({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return zero processed when no recipients match', async () => {
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([]);

      const result = await service.bulkAssignRecipientsToCrm({
        recipientIds: ['rec-1'],
      });

      expect(result.totalProcessed).toBe(0);
    });

    it('should bulk process recipients and create new leads or link existing', async () => {
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([
        {
          id: 'r1',
          name: 'Existing Person',
          email: 'exist@example.com',
          phone: '+911111111111',
          campaign: { title: 'Campaign 1', projectId: 'proj-1' },
        },
        {
          id: 'r2',
          name: 'New Person',
          email: 'new@example.com',
          phone: '+912222222222',
          campaign: { title: 'Campaign 1', projectId: 'proj-1' },
        },
      ]);

      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-exist',
          email: 'exist@example.com',
          phone: '+911111111111',
        },
      ]);
      mockPrisma.leadSource.upsert.mockResolvedValue({ id: 'src-1' });
      mockPrisma.lead.create.mockResolvedValue({ id: 'lead-new' });

      const res = await service.bulkAssignRecipientsToCrm({
        campaignIds: ['camp-1'],
      });

      expect(res.totalProcessed).toBe(2);
      expect(res.alreadyExisted).toBe(1);
      expect(res.newlyCreated).toBe(1);
    });
  });

  describe('getExportLeadsData', () => {
    it('should throw BadRequestException if no ids supplied', async () => {
      await expect(service.getExportLeadsData({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should format recipient records for export', async () => {
      mockPrisma.campaignRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+919999999999',
          status: 'DELIVERED',
          campaignId: 'camp-1',
          campaign: {
            title: 'Launch Event',
            project: { id: 'p-1', name: 'Skyline' },
          },
          openCount: 1,
          clickCount: 0,
          sentAt: new Date('2026-01-01'),
          firstOpenedAt: new Date('2026-01-02'),
          firstClickedAt: null,
          leadId: null,
        },
      ]);

      const data = await service.getExportLeadsData({
        recipientIds: ['rec-1'],
      });

      expect(data).toHaveLength(1);
      expect(data[0].email).toBe('john@example.com');
      expect(data[0].projectName).toBe('Skyline');
    });
  });

  describe('partitionAudienceAcrossPools', () => {
    const recipients = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

    it('should return unchanged list if no pools provided', () => {
      const result = service.partitionAudienceAcrossPools(recipients, []);
      expect(result.partitionedRecipients).toEqual(recipients);
      expect(result.allocations).toEqual([]);
    });

    it('should evenly partition recipients across pools with AUTO_EVEN', () => {
      const pools: any[] = [
        {
          senderDomainId: 'dom-1',
          fromEmail: 'a@mail.com',
          provider: 'AWS_SES',
        },
        {
          senderDomainId: 'dom-2',
          fromEmail: 'b@mail.com',
          provider: 'SENDGRID',
        },
      ];

      const result = service.partitionAudienceAcrossPools(
        recipients,
        pools,
        'AUTO_EVEN',
      );

      expect(result.partitionedRecipients).toHaveLength(5);
      expect(result.allocations).toHaveLength(2);
      // 5 divided by 2 -> 3 and 2
      expect(result.allocations[0].count + result.allocations[1].count).toBe(5);
    });

    it('should partition according to custom weights', () => {
      const pools: any[] = [
        {
          senderDomainId: 'dom-1',
          fromEmail: 'a@mail.com',
          provider: 'AWS_SES',
          weight: 80,
        },
        {
          senderDomainId: 'dom-2',
          fromEmail: 'b@mail.com',
          provider: 'SENDGRID',
          weight: 20,
        },
      ];

      const result = service.partitionAudienceAcrossPools(
        recipients,
        pools,
        'CUSTOM_PERCENTAGE',
      );

      expect(result.partitionedRecipients).toHaveLength(5);
      expect(result.allocations[0].count).toBe(4);
      expect(result.allocations[1].count).toBe(1);
    });
  });
});
