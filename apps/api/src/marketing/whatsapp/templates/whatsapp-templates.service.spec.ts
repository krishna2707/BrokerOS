jest.mock('@brokeros/int-whatsapp', () => ({
  fetchMessageTemplates: jest.fn().mockResolvedValue([
    {
      name: 'prelaunch_offer',
      language: 'en_US',
      category: 'MARKETING',
      status: 'APPROVED',
      components: [
        { type: 'BODY', text: 'Exclusive 3BHK offer for you!' },
        { type: 'HEADER', text: 'Skyline Update' },
        { type: 'FOOTER', text: 'Reply STOP to opt out' },
      ],
    },
  ]),
  submitMessageTemplate: jest.fn().mockResolvedValue({ id: 'tmpl-meta-1', status: 'PENDING' }),
  deleteMessageTemplate: jest.fn().mockResolvedValue({ success: true }),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppTemplatesService } from './whatsapp-templates.service.js';
import { fetchMessageTemplates, submitMessageTemplate, deleteMessageTemplate } from '@brokeros/int-whatsapp';

describe('WhatsAppTemplatesService', () => {
  let service: WhatsAppTemplatesService;
  let mockPrisma: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      getDecryptedAccount: jest.fn(),
    };

    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppTemplate: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new WhatsAppTemplatesService(mockConfigService);
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncTemplates', () => {
    it('should throw BadRequestException if account not found', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue(null);

      await expect(service.syncTemplates('none')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fetch templates from Meta and upsert into database', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        wabaId: 'waba-1',
        accessToken: 'meta-token',
      });
      mockPrisma.whatsAppTemplate.upsert.mockResolvedValue({ id: 't-1' });

      const res = await service.syncTemplates('acc-1');

      expect(fetchMessageTemplates).toHaveBeenCalledWith({
        wabaId: 'waba-1',
        accessToken: 'meta-token',
        limit: 100,
      });
      expect(mockPrisma.whatsAppTemplate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId_name_language: {
              accountId: 'acc-1',
              name: 'prelaunch_offer',
              language: 'en_US',
            },
          },
          create: expect.objectContaining({
            name: 'prelaunch_offer',
            bodyText: 'Exclusive 3BHK offer for you!',
            headerText: 'Skyline Update',
            footerText: 'Reply STOP to opt out',
          }),
        }),
      );
      expect(res.syncedCount).toBe(1);
    });
  });

  describe('listTemplates', () => {
    it('should return paginated active templates', async () => {
      mockPrisma.whatsAppTemplate.findMany.mockResolvedValue([
        { id: 't-1', name: 'prelaunch_offer', status: 'APPROVED' },
      ]);
      mockPrisma.whatsAppTemplate.count.mockResolvedValue(1);

      const res = await service.listTemplates({ page: 1, limit: 10 }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
      expect(mockPrisma.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ accountId: 'acc-1', isActive: true }),
        }),
      );
    });
  });

  describe('getTemplate', () => {
    it('should throw NotFoundException if template not found', async () => {
      mockPrisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return template if found', async () => {
      mockPrisma.whatsAppTemplate.findFirst.mockResolvedValue({ id: 't-1' });

      const res = await service.getTemplate('t-1');
      expect(res.id).toBe('t-1');
    });
  });

  describe('createTemplate', () => {
    it('should submit template to Meta and save locally', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        wabaId: 'waba-1',
        accessToken: 'meta-token',
      });
      mockPrisma.whatsAppTemplate.upsert.mockResolvedValue({
        id: 'tmpl-created-1',
        name: 'site_visit_invite',
      });

      const res = await service.createTemplate(
        {
          name: 'site_visit_invite',
          language: 'en_US',
          category: 'MARKETING',
          bodyText: 'You are invited to visit Skyline!',
          headerText: 'VIP Invitation',
        },
        'acc-1',
      );

      expect(submitMessageTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          wabaId: 'waba-1',
          accessToken: 'meta-token',
        }),
      );
      expect(mockPrisma.whatsAppTemplate.upsert).toHaveBeenCalled();
      expect(res.id).toBe('tmpl-created-1');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template from Meta and mark inactive in DB', async () => {
      mockPrisma.whatsAppTemplate.findFirst.mockResolvedValue({
        id: 't-1',
        name: 'old_tmpl',
        accountId: 'acc-1',
      });
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        wabaId: 'waba-1',
        accessToken: 'token',
      });
      mockPrisma.whatsAppTemplate.update.mockResolvedValue({ id: 't-1' });

      const res = await service.deleteTemplate('t-1');

      expect(deleteMessageTemplate).toHaveBeenCalledWith({
        wabaId: 'waba-1',
        accessToken: 'token',
        name: 'old_tmpl',
      });
      expect(mockPrisma.whatsAppTemplate.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { isActive: false },
      });
      expect(res.success).toBe(true);
    });
  });
});
