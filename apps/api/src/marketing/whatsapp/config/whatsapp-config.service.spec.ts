jest.mock('@brokeros/int-whatsapp', () => ({
  encrypt: jest.fn((val: string) => `encrypted_${val}`),
  decrypt: jest.fn((val: string) => val.replace('encrypted_', '')),
  verifyPhoneNumber: jest.fn().mockResolvedValue({
    verified_name: 'Verified Real Estate Ltd',
    display_phone_number: '+91 98765 43210',
  }),
  subscribeWabaToApp: jest.fn().mockResolvedValue({ success: true }),
}));

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WhatsAppConfigService } from './whatsapp-config.service.js';
import { verifyPhoneNumber, subscribeWabaToApp } from '@brokeros/int-whatsapp';

describe('WhatsAppConfigService', () => {
  let service: WhatsAppConfigService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new WhatsAppConfigService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return null if no account found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      const res = await service.getConfig();
      expect(res).toBeNull();
    });

    it('should return masked account when active account exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        businessName: 'Skyline Homes',
        phoneNumberId: 'phone-100',
        displayPhone: '+919876543210',
        wabaId: 'waba-100',
        isActive: true,
        webhookVerifiedAt: new Date(),
        appSecret: 'secret_live',
        webhookSecret: 'wh_secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.getConfig();
      expect(res).toBeDefined();
      expect(res?.id).toBe('acc-1');
      expect(res?.businessName).toBe('Skyline Homes');
      expect(res?.hasAppSecret).toBe(true);
      expect(res?.hasWebhookSecret).toBe(true);
    });

    it('should find account by id when id is provided', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue({
        id: 'acc-2',
        businessName: 'Skyline Luxury',
        phoneNumberId: 'phone-200',
        displayPhone: '+919876543211',
        wabaId: 'waba-200',
        isActive: true,
      });

      const res = await service.getConfig('acc-2');
      expect(mockPrisma.whatsAppBusinessAccount.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-2' },
      });
      expect(res?.id).toBe('acc-2');
    });
  });

  describe('listAccounts', () => {
    it('should list all accounts in descending order', async () => {
      mockPrisma.whatsAppBusinessAccount.findMany.mockResolvedValue([
        {
          id: 'acc-1',
          businessName: 'Skyline Main',
          phoneNumberId: 'phone-100',
          isActive: true,
        },
      ]);

      const res = await service.listAccounts();
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('acc-1');
    });
  });

  describe('connectAccount', () => {
    it('should throw BadRequestException if verifyPhoneNumber fails', async () => {
      (verifyPhoneNumber as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token provided'),
      );

      await expect(
        service.connectAccount({
          phoneNumberId: 'phone-bad',
          wabaId: 'waba-bad',
          accessToken: 'token-bad',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify with Meta, subscribe WABA, encrypt token and upsert account', async () => {
      (verifyPhoneNumber as jest.Mock).mockResolvedValueOnce({
        verified_name: 'Skyline Verified',
        display_phone_number: '+91 99999 88888',
      });
      (subscribeWabaToApp as jest.Mock).mockResolvedValueOnce({ success: true });

      mockPrisma.whatsAppBusinessAccount.upsert.mockResolvedValue({
        id: 'acc-new',
        businessName: 'Skyline Verified',
        phoneNumberId: 'phone-101',
        displayPhone: '+91 99999 88888',
        wabaId: 'waba-101',
        isActive: true,
      });

      const res = await service.connectAccount({
        phoneNumberId: 'phone-101',
        wabaId: 'waba-101',
        accessToken: 'plain_token_abc',
      });

      expect(verifyPhoneNumber).toHaveBeenCalledWith({
        phoneNumberId: 'phone-101',
        accessToken: 'plain_token_abc',
      });
      expect(subscribeWabaToApp).toHaveBeenCalledWith({
        wabaId: 'waba-101',
        accessToken: 'plain_token_abc',
      });
      expect(mockPrisma.whatsAppBusinessAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phoneNumberId: 'phone-101' },
          create: expect.objectContaining({
            phoneNumberId: 'phone-101',
            accessToken: 'encrypted_plain_token_abc',
          }),
        }),
      );
      expect(res.id).toBe('acc-new');
    });
  });

  describe('updateAccount', () => {
    it('should throw NotFoundException if account does not exist', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAccount('none', { businessName: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update fields and re-encrypt accessToken if provided', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppBusinessAccount.update.mockResolvedValue({
        id: 'acc-1',
        businessName: 'Updated Name',
        isActive: true,
      });

      const res = await service.updateAccount('acc-1', {
        businessName: 'Updated Name',
        accessToken: 'new_token_123',
      });

      expect(mockPrisma.whatsAppBusinessAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: expect.objectContaining({
          businessName: 'Updated Name',
          accessToken: 'encrypted_new_token_123',
        }),
      });
      expect(res.businessName).toBe('Updated Name');
    });
  });

  describe('disconnectAccount', () => {
    it('should throw NotFoundException if account does not exist', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue(null);

      await expect(service.disconnectAccount('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should deactivate account', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue({ id: 'acc-1' });
      mockPrisma.whatsAppBusinessAccount.update.mockResolvedValue({
        id: 'acc-1',
        isActive: false,
      });

      const res = await service.disconnectAccount('acc-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.whatsAppBusinessAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getDecryptedAccount', () => {
    it('should return null if no account exists', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      const res = await service.getDecryptedAccount('phone-none');
      expect(res).toBeNull();
    });

    it('should return account with decrypted accessToken', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        phoneNumberId: 'phone-100',
        accessToken: 'encrypted_secret_token',
      });

      const res = await service.getDecryptedAccount('phone-100');
      expect(res).toBeDefined();
      expect(res?.accessToken).toBe('secret_token');
    });
  });

  describe('verifyWebhook', () => {
    const originalEnv = process.env.WA_WEBHOOK_VERIFY_TOKEN;

    afterEach(() => {
      process.env.WA_WEBHOOK_VERIFY_TOKEN = originalEnv;
    });

    it('should return challenge when token matches', () => {
      process.env.WA_WEBHOOK_VERIFY_TOKEN = 'test_token';

      const res = service.verifyWebhook('subscribe', 'test_token', 'challenge_12345');
      expect(res).toBe('challenge_12345');
    });

    it('should throw ForbiddenException if token or mode does not match', () => {
      process.env.WA_WEBHOOK_VERIFY_TOKEN = 'test_token';

      expect(() =>
        service.verifyWebhook('subscribe', 'wrong_token', 'challenge_12345'),
      ).toThrow(ForbiddenException);
    });
  });
});
