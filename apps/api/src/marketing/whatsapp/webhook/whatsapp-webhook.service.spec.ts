jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

jest.mock('@brokeros/int-whatsapp', () => ({
  verifyMetaWebhookSignature: jest.fn(),
  sanitizePhoneForMeta: jest.fn((phone: string) => phone.replace(/\D/g, '')),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppWebhookService } from './whatsapp-webhook.service.js';
import { WhatsAppRealtimeGateway } from '../gateway/whatsapp-realtime.gateway.js';
import { WhatsAppAutomationEngineService } from '../automations/whatsapp-automation-engine.service.js';
import { WhatsAppFlowEngineService } from '../flows/whatsapp-flow-engine.service.js';
import { WhatsAppOutboundWebhooksService } from '../webhooks/whatsapp-outbound-webhooks.service.js';
import { WhatsAppAiService } from '../ai/whatsapp-ai.service.js';
import {
  verifyMetaWebhookSignature,
  sanitizePhoneForMeta,
} from '@brokeros/int-whatsapp';

describe('WhatsAppWebhookService', () => {
  let service: WhatsAppWebhookService;
  let mockPrisma: any;
  let mockRealtimeGateway: any;
  let mockAutomationEngine: any;
  let mockFlowEngine: any;
  let mockOutboundWebhooks: any;
  let mockAiService: any;

  beforeEach(async () => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findUnique: jest.fn(),
      },
      whatsAppMessage: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
      whatsAppBroadcastRecipient: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      whatsAppBroadcast: {
        update: jest.fn().mockResolvedValue({}),
      },
      whatsAppContact: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      whatsAppConversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(mockPrisma)),
    };

    mockRealtimeGateway = {
      emitMessageReceived: jest.fn(),
      emitConversationUpdated: jest.fn(),
    };

    mockAutomationEngine = {
      runAutomationsForTrigger: jest.fn().mockResolvedValue(undefined),
    };

    mockFlowEngine = {
      dispatchInboundToFlows: jest.fn().mockResolvedValue({ handled: false }),
    };

    mockOutboundWebhooks = {
      dispatchEvent: jest.fn(),
    };

    mockAiService = {
      dispatchInboundToAiReply: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppWebhookService,
        { provide: WhatsAppRealtimeGateway, useValue: mockRealtimeGateway },
        {
          provide: WhatsAppAutomationEngineService,
          useValue: mockAutomationEngine,
        },
        { provide: WhatsAppFlowEngineService, useValue: mockFlowEngine },
        {
          provide: WhatsAppOutboundWebhooksService,
          useValue: mockOutboundWebhooks,
        },
        { provide: WhatsAppAiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<WhatsAppWebhookService>(WhatsAppWebhookService);
    (service as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should delegate to verifyMetaWebhookSignature', () => {
      (verifyMetaWebhookSignature as jest.Mock).mockReturnValue(true);

      const res = service.verifySignature('body', 'sha256=123', 'secret');
      expect(verifyMetaWebhookSignature).toHaveBeenCalledWith(
        'body',
        'sha256=123',
        'secret',
      );
      expect(res).toBe(true);
    });
  });

  describe('handleMetaPayload', () => {
    it('should return early if payload is missing entry', async () => {
      await service.handleMetaPayload(null as any);
      expect(mockPrisma.whatsAppBusinessAccount.findUnique).not.toHaveBeenCalled();
    });

    it('should ignore webhook if account is not found or inactive', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue(null);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'meta-entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    phone_number_id: 'pn-unknown',
                    display_phone_number: '12345',
                  },
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      await service.handleMetaPayload(payload as any);
      expect(mockPrisma.whatsAppBusinessAccount.findUnique).toHaveBeenCalledWith({
        where: { phoneNumberId: 'pn-unknown' },
      });
      expect(mockRealtimeGateway.emitMessageReceived).not.toHaveBeenCalled();
    });

    it('should process statuses when present in payload', async () => {
      mockPrisma.whatsAppBusinessAccount.findUnique.mockResolvedValue({
        id: 'acc-1',
        isActive: true,
      });
      mockPrisma.whatsAppBroadcastRecipient.findUnique.mockResolvedValue(null);

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'meta-entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { phone_number_id: 'pn-1' },
                  statuses: [
                    {
                      id: 'msg-wamid-1',
                      status: 'delivered',
                      timestamp: '1690000000',
                      recipient_id: '919876543210',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      await service.handleMetaPayload(payload as any);

      expect(mockPrisma.whatsAppMessage.updateMany).toHaveBeenCalledWith({
        where: { waMessageId: 'msg-wamid-1' },
        data: expect.objectContaining({ status: 'DELIVERED' }),
      });
      expect(mockOutboundWebhooks.dispatchEvent).toHaveBeenCalledWith(
        'acc-1',
        'message.status',
        expect.anything(),
      );
    });
  });

  describe('handleStatusUpdate', () => {
    it('should update broadcast recipient and aggregate counters when recipient found', async () => {
      mockPrisma.whatsAppMessage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.whatsAppBroadcastRecipient.findUnique.mockResolvedValue({
        id: 'recip-1',
        broadcastId: 'bcast-1',
      });

      await service.handleStatusUpdate('acc-1', {
        id: 'msg-bcast-1',
        status: 'read',
        timestamp: '1690000000',
        recipient_id: '919876543210',
      });

      expect(mockPrisma.whatsAppBroadcastRecipient.update).toHaveBeenCalledWith({
        where: { id: 'recip-1' },
        data: expect.objectContaining({ status: 'READ' }),
      });
      expect(mockPrisma.whatsAppBroadcast.update).toHaveBeenCalledWith({
        where: { id: 'bcast-1' },
        data: { readCount: { increment: 1 } },
      });
    });

    it('should record failure reason if status is failed', async () => {
      mockPrisma.whatsAppBroadcastRecipient.findUnique.mockResolvedValue(null);

      await service.handleStatusUpdate('acc-1', {
        id: 'msg-failed-1',
        status: 'failed',
        timestamp: '1690000000',
        recipient_id: '919876543210',
        errors: [{ code: 131026, title: 'Undeliverable', message: 'Message undeliverable' }],
      });

      expect(mockPrisma.whatsAppMessage.updateMany).toHaveBeenCalledWith({
        where: { waMessageId: 'msg-failed-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Message undeliverable',
        }),
      });
    });
  });

  describe('handleInboundMessage', () => {
    it('should process inbound text message, store it, emit realtime events, and trigger downstream hooks', async () => {
      const contactMock = {
        id: 'contact-1',
        accountId: 'acc-1',
        phone: '919876543210',
        name: 'John Doe',
      };
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(contactMock);

      const convMock = {
        id: 'conv-1',
        accountId: 'acc-1',
        contactId: 'contact-1',
        status: 'open',
        isActive: true,
      };
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(convMock);

      const messageRecord = {
        id: 'msg-row-1',
        waMessageId: 'wamid.12345',
        conversationId: 'conv-1',
        direction: 'INBOUND',
        type: 'TEXT',
        status: 'RECEIVED',
        body: 'Interested in 3BHK flat',
        sentAt: new Date(),
      };
      mockPrisma.whatsAppMessage.create.mockResolvedValue(messageRecord);
      mockPrisma.whatsAppConversation.update.mockResolvedValue({
        ...convMock,
        lastMessageText: 'Interested in 3BHK flat',
      });
      mockPrisma.whatsAppMessage.count.mockResolvedValue(1);

      const metaMessage = {
        from: '919876543210',
        id: 'wamid.12345',
        timestamp: '1690000000',
        type: 'text' as const,
        text: { body: 'Interested in 3BHK flat' },
      };

      await service.handleInboundMessage('acc-1', metaMessage as any, {
        profile: { name: 'John Doe' },
      });

      expect(mockPrisma.whatsAppMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          waMessageId: 'wamid.12345',
          conversationId: 'conv-1',
          body: 'Interested in 3BHK flat',
          direction: 'INBOUND',
        }),
      });

      expect(mockRealtimeGateway.emitMessageReceived).toHaveBeenCalledWith(
        'conv-1',
        messageRecord,
        'acc-1',
      );
      expect(mockRealtimeGateway.emitConversationUpdated).toHaveBeenCalledWith(
        'acc-1',
        expect.anything(),
      );
      expect(mockOutboundWebhooks.dispatchEvent).toHaveBeenCalledWith(
        'acc-1',
        'message.received',
        messageRecord,
      );

      // Wait for setImmediate downstream hooks
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockFlowEngine.dispatchInboundToFlows).toHaveBeenCalled();
      expect(mockAutomationEngine.runAutomationsForTrigger).toHaveBeenCalledWith(
        'acc-1',
        'new_message_received',
        'contact-1',
        expect.objectContaining({ messageText: 'Interested in 3BHK flat' }),
      );
      expect(mockAiService.dispatchInboundToAiReply).toHaveBeenCalledWith(
        'acc-1',
        'conv-1',
        'contact-1',
      );
    });

    it('should create new contact and link CRM lead if lead exists with same phone', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue(null);
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'crm-lead-888' });
      mockPrisma.whatsAppContact.create.mockResolvedValue({
        id: 'contact-new',
        accountId: 'acc-1',
        phone: '919876543210',
        leadId: 'crm-lead-888',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrisma.whatsAppConversation.create.mockResolvedValue({
        id: 'conv-new',
        accountId: 'acc-1',
        contactId: 'contact-new',
        status: 'open',
      });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-row-2',
        sentAt: new Date(),
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({});

      const metaMessage = {
        from: '919876543210',
        id: 'wamid.67890',
        timestamp: '1690000000',
        type: 'text' as const,
        text: { body: 'Hello' },
      };

      await service.handleInboundMessage('acc-1', metaMessage as any);

      expect(mockPrisma.whatsAppContact.create).toHaveBeenCalledWith({
        data: {
          accountId: 'acc-1',
          phone: '919876543210',
          name: null,
          leadId: 'crm-lead-888',
        },
      });
      expect(mockPrisma.whatsAppConversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          contactId: 'contact-new',
          status: 'open',
        }),
      });
    });

    it('should handle interactive button reply message correctly', async () => {
      mockPrisma.whatsAppContact.findUnique.mockResolvedValue({
        id: 'contact-1',
        accountId: 'acc-1',
      });
      mockPrisma.whatsAppConversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        accountId: 'acc-1',
      });
      mockPrisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg-row-interactive',
        sentAt: new Date(),
        body: 'Schedule Visit',
        interactivePayload: {
          type: 'button_reply',
          id: 'btn_schedule_visit',
          title: 'Schedule Visit',
        },
      });
      mockPrisma.whatsAppConversation.update.mockResolvedValue({});
      mockPrisma.whatsAppMessage.count.mockResolvedValue(2);

      const metaMessage = {
        from: '919876543210',
        id: 'wamid.interactive',
        timestamp: '1690000000',
        type: 'interactive' as const,
        interactive: {
          type: 'button_reply',
          button_reply: {
            id: 'btn_schedule_visit',
            title: 'Schedule Visit',
          },
        },
      };

      await service.handleInboundMessage('acc-1', metaMessage as any);

      expect(mockPrisma.whatsAppMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'INTERACTIVE',
          contentType: 'interactive',
          body: 'Schedule Visit',
          interactivePayload: {
            type: 'button_reply',
            id: 'btn_schedule_visit',
            title: 'Schedule Visit',
          },
        }),
      });

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockAutomationEngine.runAutomationsForTrigger).toHaveBeenCalledWith(
        'acc-1',
        'interactive_reply',
        'contact-1',
        expect.objectContaining({
          interactiveReplyId: 'btn_schedule_visit',
        }),
      );
    });
  });
});
