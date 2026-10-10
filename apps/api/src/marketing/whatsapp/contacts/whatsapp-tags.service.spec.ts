import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppTagsService } from './whatsapp-tags.service.js';

describe('WhatsAppTagsService', () => {
  let service: WhatsAppTagsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppTag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppContact: {
        findUnique: jest.fn(),
      },
      whatsAppContactTag: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new WhatsAppTagsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listTags', () => {
    it('should list tags with contact counts', async () => {
      mockPrisma.whatsAppTag.findMany.mockResolvedValue([
        { id: 'tag-1', name: 'VIP Buyer', _count: { contacts: 5 } },
      ]);

      const res = await service.listTags('acc-1');
      expect(mockPrisma.whatsAppTag.findMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
        orderBy: { name: 'asc' },
        include: { _count: { select: { contacts: true } } },
      });
      expect(res.length).toBe(1);
    });
  });

  describe('createTag', () => {
    it('should throw BadRequestException if no accountId and no default account found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(service.createTag({ name: 'NRI' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upsert tag with default color if omitted', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppTag.upsert.mockResolvedValue({
        id: 'tag-1',
        name: 'Investor',
        color: '#3B82F6',
      });

      const res = await service.createTag({ name: 'Investor' });
      expect(mockPrisma.whatsAppTag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId_name: { accountId: 'acc-1', name: 'Investor' } },
          create: expect.objectContaining({ name: 'Investor', color: '#3B82F6' }),
        }),
      );
      expect(res.id).toBe('tag-1');
    });
  });

  describe('deleteTag', () => {
    it('should delete tag by id', async () => {
      mockPrisma.whatsAppTag.delete.mockResolvedValue({ id: 'tag-1' });

      const res = await service.deleteTag('tag-1');
      expect(res.success).toBe(true);
    });
  });

  describe('addTag', () => {
    it('should throw NotFoundException if contact not found', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(null);

      await expect(service.addTag('c-none', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.whatsAppTag.findUnique.mockResolvedValue(null);

      await expect(service.addTag('c-1', 'tag-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should attach tag to contact via whatsAppContactTag upsert', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.whatsAppTag.findUnique.mockResolvedValue({ id: 'tag-1' });
      mockPrisma.whatsAppContactTag.upsert.mockResolvedValue({
        contactId: 'c-1',
        tagId: 'tag-1',
      });

      const res = await service.addTag('c-1', 'tag-1');
      expect(res.tagId).toBe('tag-1');
    });
  });

  describe('removeTag', () => {
    it('should remove tag link from contact', async () => {
      mockPrisma.whatsAppContactTag.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.removeTag('c-1', 'tag-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.whatsAppContactTag.deleteMany).toHaveBeenCalledWith({
        where: { contactId: 'c-1', tagId: 'tag-1' },
      });
    });
  });
});
