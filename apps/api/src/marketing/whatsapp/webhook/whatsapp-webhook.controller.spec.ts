jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller.js';
import { WhatsAppConfigService } from '../config/whatsapp-config.service.js';
import { WhatsAppWebhookService } from './whatsapp-webhook.service.js';

describe('WhatsAppWebhookController', () => {
  let controller: WhatsAppWebhookController;
  let mockConfigService: Partial<Record<keyof WhatsAppConfigService, jest.Mock>>;
  let mockWebhookService: Partial<Record<keyof WhatsAppWebhookService, jest.Mock>>;

  beforeEach(async () => {
    mockConfigService = {
      verifyWebhook: jest.fn(),
    };

    mockWebhookService = {
      verifySignature: jest.fn(),
      handleMetaPayload: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppWebhookController],
      providers: [
        { provide: WhatsAppConfigService, useValue: mockConfigService },
        { provide: WhatsAppWebhookService, useValue: mockWebhookService },
      ],
    }).compile();

    controller = module.get<WhatsAppWebhookController>(
      WhatsAppWebhookController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyChallenge', () => {
    it('should verify webhook challenge and send response', () => {
      mockConfigService.verifyWebhook!.mockReturnValue('123456');

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      controller.verifyChallenge(
        'subscribe',
        'my-verify-token',
        '123456',
        mockRes,
      );

      expect(mockConfigService.verifyWebhook).toHaveBeenCalledWith(
        'subscribe',
        'my-verify-token',
        '123456',
      );
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.send).toHaveBeenCalledWith('123456');
    });
  });

  describe('handleInboundPayload', () => {
    it('should throw UnauthorizedException if app secret is set and signature verification fails', async () => {
      const originalSecret = process.env.META_APP_SECRET;
      process.env.META_APP_SECRET = 'app-secret';
      mockWebhookService.verifySignature!.mockReturnValue(false);

      try {
        const payload = { entry: [] };
        await expect(
          controller.handleInboundPayload('sha256=invalid', payload),
        ).rejects.toThrow(UnauthorizedException);
      } finally {
        process.env.META_APP_SECRET = originalSecret;
      }
    });

    it('should accept valid signature and dispatch payload to webhookService', async () => {
      const originalSecret = process.env.META_APP_SECRET;
      process.env.META_APP_SECRET = 'app-secret';
      mockWebhookService.verifySignature!.mockReturnValue(true);

      try {
        const payload = { entry: [] };
        const res = await controller.handleInboundPayload(
          'sha256=valid',
          payload,
        );

        expect(res).toEqual({ status: 'received' });
        expect(mockWebhookService.handleMetaPayload).toHaveBeenCalledWith(payload);
      } finally {
        process.env.META_APP_SECRET = originalSecret;
      }
    });

    it('should accept payload without signature if no app secret is set', async () => {
      const originalSecret = process.env.META_APP_SECRET;
      const originalWaSecret = process.env.WA_APP_SECRET;
      delete process.env.META_APP_SECRET;
      delete process.env.WA_APP_SECRET;

      try {
        const payload = { entry: [] };
        const res = await controller.handleInboundPayload(undefined, payload);

        expect(res).toEqual({ status: 'received' });
        expect(mockWebhookService.handleMetaPayload).toHaveBeenCalledWith(payload);
      } finally {
        process.env.META_APP_SECRET = originalSecret;
        process.env.WA_APP_SECRET = originalWaSecret;
      }
    });
  });
});
