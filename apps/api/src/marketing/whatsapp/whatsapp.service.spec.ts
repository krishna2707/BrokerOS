jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { WhatsAppService } from './whatsapp.service.js';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let mockConfigService: any;
  let mockWebhookService: any;
  let mockConversationsService: any;
  let mockMessagesService: any;
  let mockContactsService: any;
  let mockBroadcastsService: any;
  let mockAutomationsService: any;
  let mockAutomationEngine: any;
  let mockRealtimeGateway: any;

  beforeEach(() => {
    mockConfigService = {
      getConfig: jest.fn(),
    };
    mockWebhookService = {};
    mockConversationsService = {};
    mockMessagesService = {};
    mockContactsService = {};
    mockBroadcastsService = {};
    mockAutomationsService = {};
    mockAutomationEngine = {};
    mockRealtimeGateway = {};

    service = new WhatsAppService(
      mockConfigService,
      mockWebhookService,
      mockConversationsService,
      mockMessagesService,
      mockContactsService,
      mockBroadcastsService,
      mockAutomationsService,
      mockAutomationEngine,
      mockRealtimeGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return connected false when no active config exists', async () => {
      mockConfigService.getConfig.mockResolvedValue(null);

      const res = await service.getStatus();
      expect(res).toEqual({
        connected: false,
        phoneNumberId: null,
        displayPhone: null,
        businessName: null,
        webhookVerified: false,
      });
    });

    it('should return connected status and business details when active config exists', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        isActive: true,
        phoneNumberId: 'phone_123',
        displayPhone: '+919876543210',
        businessName: 'Skyline Luxury Living',
        webhookVerifiedAt: new Date('2026-01-01'),
      });

      const res = await service.getStatus();
      expect(res).toEqual({
        connected: true,
        phoneNumberId: 'phone_123',
        displayPhone: '+919876543210',
        businessName: 'Skyline Luxury Living',
        webhookVerified: true,
      });
    });
  });
});
