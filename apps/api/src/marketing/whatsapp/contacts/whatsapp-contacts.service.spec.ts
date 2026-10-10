jest.mock('@brokeros/int-whatsapp', () => ({
  sanitizePhoneForMeta: jest.fn((phone: string) => phone.trim()),
  isValidE164: jest.fn((phone: string) => phone.startsWith('+') && phone.length >= 10),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppContactsService } from './whatsapp-contacts.service.js';

describe('WhatsAppContactsService', () => {
  let service: WhatsAppContactsService;
  let mockPrisma: any;
  let mockTagsService: any;
  let mockQuickRepliesService: any;

  beforeEach(() => {
    mockTagsService = {
      listTags: jest.fn(),
      createTag: jest.fn(),
      deleteTag: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
    };

    mockQuickRepliesService = {
      listQuickReplies: jest.fn(),
      createQuickReply: jest.fn(),
      updateQuickReply: jest.fn(),
      deleteQuickReply: jest.fn(),
    };

    mockPrisma = {
      whatsAppContact: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
      whatsAppConversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      whatsAppContactNote: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppCustomField: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      whatsAppContactCustomValue: {
        upsert: jest.fn(),
      },
      whatsAppTag: {
        upsert: jest.fn(),
      },
      whatsAppContactTag: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    service = new WhatsAppContactsService(mockTagsService, mockQuickRepliesService);
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listContacts', () => {
    it('should return paginated contacts with filters', async () => {
      mockPrisma.whatsAppContact.findMany.mockResolvedValue([
        { id: 'c-1', name: 'John Doe', phone: '+919876543210' },
      ]);
      mockPrisma.whatsAppContact.count.mockResolvedValue(1);

      const res = await service.listContacts({ page: 1, limit: 10, search: 'John' }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
      expect(res.pagination.pages).toBe(1);
      expect(mockPrisma.whatsAppContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accountId: 'acc-1',
            deletedAt: null,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getContact', () => {
    it('should throw NotFoundException if contact not found', async () => {
      mockPrisma.whatsAppContact.findFirst.mockResolvedValue(null);

      await expect(service.getContact('none')).rejects.toThrow(NotFoundException);
    });

    it('should return full contact details with relations', async () => {
      mockPrisma.whatsAppContact.findFirst.mockResolvedValue({
        id: 'c-1',
        name: 'Alice',
        phone: '+919876543210',
        tags: [],
        conversations: [],
      });

      const res = await service.getContact('c-1');
      expect(res.id).toBe('c-1');
      expect(res.name).toBe('Alice');
    });
  });

  describe('createContact', () => {
    it('should throw BadRequestException if phone number is invalid E.164', async () => {
      await expect(
        service.createContact({ phone: 'invalid-number' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no accountId and no default account exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.createContact({ phone: '+919876543210' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert contact and auto-create conversation if none exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppContact.upsert.mockResolvedValue({
        id: 'c-1',
        accountId: 'acc-1',
        phone: '+919876543210',
        name: 'Bob',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppConversation.create.mockResolvedValue({ id: 'conv-1' });

      const res = await service.createContact({
        phone: '+919876543210',
        name: 'Bob',
      });

      expect(res.id).toBe('c-1');
      expect(mockPrisma.whatsAppConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-1',
            contactId: 'c-1',
            contactPhone: '+919876543210',
          }),
        }),
      );
    });
  });

  describe('updateContact', () => {
    it('should throw NotFoundException if contact does not exist', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(null);

      await expect(
        service.updateContact('none', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return updated contact', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.whatsAppContact.update.mockResolvedValue({ id: 'c-1', name: 'Updated' });

      const res = await service.updateContact('c-1', { name: 'Updated' });
      expect(res.name).toBe('Updated');
    });
  });

  describe('deleteContact', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(null);

      await expect(service.deleteContact('none')).rejects.toThrow(NotFoundException);
    });

    it('should soft-delete contact with deletedAt timestamp', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.whatsAppContact.update.mockResolvedValue({ id: 'c-1' });

      const res = await service.deleteContact('c-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.whatsAppContact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('Contact Notes', () => {
    it('should list notes for a contact', async () => {
      mockPrisma.whatsAppContactNote.findMany.mockResolvedValue([
        { id: 'n-1', content: 'Met at site office' },
      ]);

      const res = await service.listNotes('c-1');
      expect(res.length).toBe(1);
    });

    it('should create note when contact exists', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.whatsAppContactNote.create.mockResolvedValue({
        id: 'n-1',
        content: 'Interested in penthouse',
      });

      const res = await service.createNote('c-1', 'Interested in penthouse', 'user-1');
      expect(res.id).toBe('n-1');
    });

    it('should delete note by id', async () => {
      mockPrisma.whatsAppContactNote.delete.mockResolvedValue({ id: 'n-1' });

      const res = await service.deleteNote('n-1');
      expect(res.success).toBe(true);
    });
  });

  describe('Custom Fields & Values', () => {
    it('should list custom fields for account', async () => {
      mockPrisma.whatsAppCustomField.findMany.mockResolvedValue([
        { id: 'f-1', name: 'Budget Range' },
      ]);

      const res = await service.listCustomFields('acc-1');
      expect(res.length).toBe(1);
    });

    it('should save contact custom values in a transaction', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({ id: 'c-1' });

      const res = await service.saveContactCustomValues('c-1', {
        'f-1': '2.5 Cr',
      });
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
    });
  });

  describe('bulkImportContacts', () => {
    it('should bulk import valid contacts and assign tags', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppContact.upsert.mockResolvedValue({ id: 'c-new', phone: '+919876543210' });
      mockPrisma.whatsAppTag.upsert.mockResolvedValue({ id: 't-1' });
      mockPrisma.whatsAppContactTag.upsert.mockResolvedValue({});

      const res = await service.bulkImportContacts(
        [
          { phone: '+919876543210', name: 'Investor One', tags: ['High Value'] },
          { phone: 'bad-phone', name: 'Ignored' },
        ],
        'acc-1',
      );

      expect(res.totalSubmitted).toBe(2);
      expect(res.imported).toBe(1);
    });
  });

  describe('Delegations to Tags and Quick Replies', () => {
    it('should delegate listTags to tagsService', async () => {
      mockTagsService.listTags.mockResolvedValue([{ id: 't-1' }]);
      const res = await service.listTags('acc-1');
      expect(mockTagsService.listTags).toHaveBeenCalledWith('acc-1');
      expect(res).toEqual([{ id: 't-1' }]);
    });

    it('should delegate listQuickReplies to quickRepliesService', async () => {
      mockQuickRepliesService.listQuickReplies.mockResolvedValue([{ id: 'qr-1' }]);
      const res = await service.listQuickReplies('acc-1');
      expect(mockQuickRepliesService.listQuickReplies).toHaveBeenCalledWith('acc-1');
      expect(res).toEqual([{ id: 'qr-1' }]);
    });
  });
});
