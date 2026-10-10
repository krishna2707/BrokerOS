jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { MetaWebhooksController } from './meta-webhooks.controller.js';

describe('MetaWebhooksController', () => {
  let controller: MetaWebhooksController;
  let mockMetaLeadsService: any;
  let mockResponse: any;

  beforeEach(() => {
    mockMetaLeadsService = {
      processLeadgenEvent: jest.fn().mockResolvedValue({ processedCount: 1 }),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    controller = new MetaWebhooksController(mockMetaLeadsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyWebhook', () => {
    it('should return 200 with challenge on valid subscribe request', () => {
      controller.verifyWebhook(
        'subscribe',
        'brokeros_meta_verify_token',
        'challenge_code_123',
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('challenge_code_123');
    });

    it('should return 403 on invalid verify token', () => {
      controller.verifyWebhook(
        'subscribe',
        'wrong_token',
        'challenge_code_123',
        mockResponse,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Forbidden: Invalid verification token',
      );
    });
  });

  describe('handleInboundLead', () => {
    it('should process webhook asynchronously and return EVENT_RECEIVED status', async () => {
      const payload = { object: 'page', entry: [] };
      const res = await controller.handleInboundLead('sha256=abc', payload);

      expect(mockMetaLeadsService.processLeadgenEvent).toHaveBeenCalledWith(
        payload,
      );
      expect(res).toEqual({ status: 'EVENT_RECEIVED' });
    });
  });
});
