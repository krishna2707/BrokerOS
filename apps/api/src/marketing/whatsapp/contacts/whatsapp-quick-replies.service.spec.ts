import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppQuickRepliesService } from './whatsapp-quick-replies.service.js';

describe('WhatsAppQuickRepliesService', () => {
  let service: WhatsAppQuickRepliesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppQuickReply: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
      },
    };

    service = new WhatsAppQuickRepliesService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listQuickReplies', () => {
    it('should list quick replies sorted by shortcut', async () => {
      mockPrisma.whatsAppQuickReply.findMany.mockResolvedValue([
        { id: 'qr-1', shortcut: '/brochure', content: 'Here is our brochure' },
      ]);

      const res = await service.listQuickReplies('acc-1');
      expect(mockPrisma.whatsAppQuickReply.findMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1' },
        orderBy: { shortcut: 'asc' },
      });
      expect(res.length).toBe(1);
    });
  });

  describe('createQuickReply', () => {
    it('should throw BadRequestException if no accountId and no default account', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.createQuickReply({ shortcut: 'hi', content: 'Hello' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should ensure leading slash and upsert quick reply', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppQuickReply.upsert.mockResolvedValue({
        id: 'qr-1',
        shortcut: '/pricing',
        content: 'Prices start from 1.5 Cr',
      });

      const res = await service.createQuickReply({
        shortcut: 'pricing',
        content: 'Prices start from 1.5 Cr',
      });

      expect(mockPrisma.whatsAppQuickReply.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId_shortcut: { accountId: 'acc-1', shortcut: '/pricing' },
          },
          create: expect.objectContaining({
            shortcut: '/pricing',
          }),
        }),
      );
      expect(res.shortcut).toBe('/pricing');
    });
  });

  describe('updateQuickReply', () => {
    it('should throw NotFoundException if quick reply not found', async () => {
      mockPrisma.whatsAppQuickReply.findUnique.mockResolvedValue(null);

      await expect(
        service.updateQuickReply('none', { content: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update quick reply content and format shortcut', async () => {
      mockPrisma.whatsAppQuickReply.findUnique.mockResolvedValue({ id: 'qr-1' });
      mockPrisma.whatsAppQuickReply.update.mockResolvedValue({
        id: 'qr-1',
        shortcut: '/info',
        content: 'Updated content',
      });

      const res = await service.updateQuickReply('qr-1', {
        shortcut: 'info',
        content: 'Updated content',
      });

      expect(mockPrisma.whatsAppQuickReply.update).toHaveBeenCalledWith({
        where: { id: 'qr-1' },
        data: {
          shortcut: '/info',
          content: 'Updated content',
        },
      });
      expect(res.content).toBe('Updated content');
    });
  });

  describe('deleteQuickReply', () => {
    it('should delete quick reply by id', async () => {
      mockPrisma.whatsAppQuickReply.delete.mockResolvedValue({ id: 'qr-1' });

      const res = await service.deleteQuickReply('qr-1');
      expect(res.success).toBe(true);
    });
  });
});
