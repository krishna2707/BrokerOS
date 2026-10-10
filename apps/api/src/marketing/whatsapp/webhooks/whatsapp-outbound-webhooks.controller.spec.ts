jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppOutboundWebhooksController } from './whatsapp-outbound-webhooks.controller.js';
import { WhatsAppOutboundWebhooksService } from './whatsapp-outbound-webhooks.service.js';

describe('WhatsAppOutboundWebhooksController', () => {
  let controller: WhatsAppOutboundWebhooksController;
  let mockService: Partial<Record<keyof WhatsAppOutboundWebhooksService, jest.Mock>>;

  beforeEach(async () => {
    mockService = {
      listEndpoints: jest.fn(),
      createEndpoint: jest.fn(),
      deleteEndpoint: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppOutboundWebhooksController],
      providers: [
        {
          provide: WhatsAppOutboundWebhooksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WhatsAppOutboundWebhooksController>(
      WhatsAppOutboundWebhooksController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listEndpoints', () => {
    it('should delegate to outboundWebhooksService.listEndpoints', async () => {
      mockService.listEndpoints!.mockResolvedValue([{ id: 'ep-1', url: 'https://ex.com' }]);

      const res = await controller.listEndpoints('acc-1');
      expect(mockService.listEndpoints).toHaveBeenCalledWith('acc-1');
      expect(res).toEqual([{ id: 'ep-1', url: 'https://ex.com' }]);
    });
  });

  describe('createEndpoint', () => {
    it('should delegate to outboundWebhooksService.createEndpoint', async () => {
      const payload = {
        url: 'https://example.com/webhook',
        secret: 'secret123',
        events: ['message.received'],
      };
      mockService.createEndpoint!.mockResolvedValue({ id: 'ep-1', ...payload });

      const res = await controller.createEndpoint('acc-1', payload);
      expect(mockService.createEndpoint).toHaveBeenCalledWith('acc-1', payload);
      expect(res).toEqual({ id: 'ep-1', ...payload });
    });
  });

  describe('deleteEndpoint', () => {
    it('should delegate to outboundWebhooksService.deleteEndpoint', async () => {
      mockService.deleteEndpoint!.mockResolvedValue({ success: true });

      const res = await controller.deleteEndpoint('ep-1', 'acc-1');
      expect(mockService.deleteEndpoint).toHaveBeenCalledWith('ep-1', 'acc-1');
      expect(res).toEqual({ success: true });
    });
  });
});
