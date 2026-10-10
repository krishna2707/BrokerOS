jest.mock('@brokeros/int-whatsapp', () => ({
  sanitizePhoneForMeta: jest.fn((phone: string) => phone.trim()),
  isValidE164: jest.fn((phone: string) => phone.startsWith('+') && phone.length >= 10),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppBroadcastsService } from './whatsapp-broadcasts.service.js';

describe('WhatsAppBroadcastsService', () => {
  let service: WhatsAppBroadcastsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn().mockResolvedValue({ id: 'acc-1' }),
      },
      whatsAppContact: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      whatsAppBroadcast: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppBroadcastRecipient: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      lead: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    service = new WhatsAppBroadcastsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBroadcast', () => {
    it('should throw BadRequestException if no recipients found', async () => {
      mockPrisma.whatsAppContact.findMany.mockResolvedValue([]);

      await expect(
        service.createBroadcast({
          name: 'Empty Broadcast',
          templateName: 'promo_1',
          contactIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create broadcast with contacts list', async () => {
      mockPrisma.whatsAppContact.findMany.mockResolvedValue([
        { id: 'c-1', phone: '+919876543210' },
      ]);
      mockPrisma.whatsAppBroadcast.create.mockResolvedValue({
        id: 'bc-1',
        name: 'Festive Launch',
        totalRecipients: 1,
      });
      mockPrisma.whatsAppBroadcastRecipient.createMany.mockResolvedValue({ count: 1 });

      const res = await service.createBroadcast(
        {
          name: 'Festive Launch',
          templateName: 'festive_offer',
          contactIds: ['c-1'],
        },
        'user-1',
      );

      expect(res.id).toBe('bc-1');
      expect(mockPrisma.whatsAppBroadcast.create).toHaveBeenCalled();
      expect(mockPrisma.whatsAppBroadcastRecipient.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              broadcastId: 'bc-1',
              phone: '+919876543210',
            }),
          ]),
        }),
      );
    });

    it('should support CRM lead segmentation filter', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          firstName: 'Ankit',
          lastName: 'Sharma',
          phone: '+919876543211',
        },
      ]);
      mockPrisma.whatsAppContact.upsert.mockResolvedValue({ id: 'c-crm-1' });
      mockPrisma.whatsAppBroadcast.create.mockResolvedValue({
        id: 'bc-crm',
        name: 'VIP Leads',
        totalRecipients: 1,
      });

      const res = await service.createBroadcast({
        name: 'VIP Leads',
        templateName: 'vip_invitation',
        crmFilter: {
          temperatures: ['HOT'],
          statuses: ['QUALIFIED'],
        },
      });

      expect(res.id).toBe('bc-crm');
      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
    });
  });

  describe('listBroadcasts', () => {
    it('should return paginated broadcasts', async () => {
      mockPrisma.whatsAppBroadcast.findMany.mockResolvedValue([
        { id: 'bc-1', name: 'Summer Campaign', status: 'COMPLETED' },
      ]);
      mockPrisma.whatsAppBroadcast.count.mockResolvedValue(1);

      const res = await service.listBroadcasts({ page: 1, limit: 10 }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('getBroadcast and getRecipients', () => {
    it('should throw NotFoundException if broadcast not found', async () => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue(null);

      await expect(service.getBroadcast('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return broadcast when found', async () => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue({ id: 'bc-1' });

      const res = await service.getBroadcast('bc-1');
      expect(res.id).toBe('bc-1');
    });

    it('should get paginated recipients for broadcast', async () => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue({ id: 'bc-1' });
      mockPrisma.whatsAppBroadcastRecipient.findMany.mockResolvedValue([
        { id: 'r-1', phone: '+919876543210', status: 'DELIVERED' },
      ]);
      mockPrisma.whatsAppBroadcastRecipient.count.mockResolvedValue(1);

      const res = await service.getRecipients('bc-1', { page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('scheduleBroadcast, dispatchNow, cancelBroadcast', () => {
    beforeEach(() => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue({
        id: 'bc-1',
        status: 'DRAFT',
      });
    });

    it('should schedule broadcast to future date', async () => {
      mockPrisma.whatsAppBroadcast.update.mockResolvedValue({
        id: 'bc-1',
        status: 'SCHEDULED',
      });

      const res = await service.scheduleBroadcast('bc-1', {
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(res.status).toBe('SCHEDULED');
    });

    it('should dispatch broadcast now', async () => {
      mockPrisma.whatsAppBroadcast.update.mockResolvedValue({
        id: 'bc-1',
        status: 'SCHEDULED',
      });

      const res = await service.dispatchNow('bc-1');
      expect(res.status).toBe('SCHEDULED');
    });

    it('should cancel broadcast', async () => {
      mockPrisma.whatsAppBroadcast.update.mockResolvedValue({
        id: 'bc-1',
        status: 'CANCELLED',
      });

      const res = await service.cancelBroadcast('bc-1');
      expect(res.status).toBe('CANCELLED');
    });
  });

  describe('deleteBroadcast', () => {
    it('should throw BadRequestException if broadcast is SENDING', async () => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue({
        id: 'bc-1',
        status: 'SENDING',
      });

      await expect(service.deleteBroadcast('bc-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete broadcast when not SENDING', async () => {
      mockPrisma.whatsAppBroadcast.findFirst.mockResolvedValue({
        id: 'bc-1',
        status: 'COMPLETED',
      });
      mockPrisma.whatsAppBroadcast.delete.mockResolvedValue({ id: 'bc-1' });

      const res = await service.deleteBroadcast('bc-1');
      expect(res.success).toBe(true);
    });
  });

  describe('getProjects & previewAudience', () => {
    it('should return active projects list', async () => {
      mockPrisma.project.findMany.mockResolvedValue([{ id: 'p-1', name: 'Skyline Palms' }]);

      const res = await service.getProjects();
      expect(res.length).toBe(1);
    });

    it('should preview audience count from CRM filters', async () => {
      mockPrisma.lead.count.mockResolvedValue(150);

      const res = await service.previewAudience({
        audienceFilters: { temperatures: ['HOT'] },
      });
      expect(res.totalCount).toBe(150);
      expect(res.finalAudienceCount).toBe(150);
    });

    it('should preview audience count from CSV rows deduplicating numbers', async () => {
      const res = await service.previewAudience({
        audienceSource: 'CSV_UPLOAD',
        csvRecipients: [
          { phone: '+919876543210' },
          { phone: '+919876543210' }, // duplicate
          { phone: '+919876543211' },
        ],
      });
      expect(res.totalCount).toBe(3);
      expect(res.duplicateCount).toBe(1);
      expect(res.finalAudienceCount).toBe(2);
    });
  });
});
