// ============================================================================
// BrokerOS — @brokeros/messaging Unit Tests (Dispatcher & Registry)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSmsProvider,
  getEmailProvider,
  dispatchScheduledMessage,
} from '../index.js';

describe('@brokeros/messaging', () => {
  describe('Provider Registries', () => {
    it('getSmsProvider returns Twilio adapter by default or case-insensitively', () => {
      const defaultProvider = getSmsProvider();
      expect(defaultProvider).toBeDefined();
      expect(typeof defaultProvider.sendBatch).toBe('function');

      const sinch = getSmsProvider('sinch');
      expect(sinch).toBeDefined();
      expect(typeof sinch.sendBatch).toBe('function');
    });

    it('getEmailProvider returns Ses adapter by default or case-insensitively', () => {
      const defaultProvider = getEmailProvider();
      expect(defaultProvider).toBeDefined();
      expect(typeof defaultProvider.sendBatch).toBe('function');

      const sendgrid = getEmailProvider('sendgrid');
      expect(sendgrid).toBeDefined();
      expect(typeof sendgrid.sendBatch).toBe('function');
    });
  });

  describe('dispatchScheduledMessage', () => {
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        smsMessage: {
          updateMany: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        smsConversation: {
          update: vi.fn(),
        },
        smsIntegration: {
          findFirst: vi.fn(),
        },
        emailMessage: {
          updateMany: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        emailConversation: {
          update: vi.fn(),
        },
        marketingIntegration: {
          findFirst: vi.fn(),
        },
        whatsAppMessage: {
          updateMany: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        whatsAppConversation: {
          update: vi.fn(),
        },
        whatsAppBusinessAccount: {
          findUnique: vi.fn(),
        },
      };
    });

    it('returns alreadyProcessed: true when atomic row reservation lock fails (0 rows updated)', async () => {
      mockPrisma.smsMessage.updateMany.mockResolvedValue({ count: 0 });

      const result = await dispatchScheduledMessage(mockPrisma, {
        channel: 'SMS',
        messageId: 'sms-msg-123',
      });

      expect(result.success).toBe(false);
      expect(result.alreadyProcessed).toBe(true);
      expect(mockPrisma.smsMessage.findUnique).not.toHaveBeenCalled();
    });

    it('dispatches SMS successfully and updates status in-place when atomic lock acquired', async () => {
      mockPrisma.smsMessage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.smsMessage.findUnique.mockResolvedValue({
        id: 'sms-msg-123',
        conversationId: 'conv-456',
        toPhone: '+14155552671',
        fromPhone: '+14155550199',
        bodyText: 'Hello from scheduled test',
        provider: 'TWILIO',
        conversation: {
          id: 'conv-456',
          assignedProvider: 'TWILIO',
          assignedSenderPhone: '+14155550199',
          contactName: 'Jane Doe',
        },
      });

      mockPrisma.smsIntegration.findFirst.mockResolvedValue({
        id: 'int-1',
        provider: 'TWILIO',
        accountSid: 'AC_TEST',
        authToken: 'AUTH_TEST',
      });

      const adapter = getSmsProvider('TWILIO');
      vi.spyOn(adapter, 'sendBatch').mockResolvedValue({
        success: true,
        provider: 'TWILIO',
        providerMessageId: 'tw-msg-999',
        sentCount: 1,
      });

      const result = await dispatchScheduledMessage(mockPrisma, {
        channel: 'SMS',
        messageId: 'sms-msg-123',
      });

      expect(result.success).toBe(true);
      expect(result.providerMsgId).toBe('tw-msg-999');

      // Verify in-place transition to DELIVERED
      expect(mockPrisma.smsMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sms-msg-123' },
          data: expect.objectContaining({
            status: 'DELIVERED',
            providerMsgId: 'tw-msg-999',
          }),
        }),
      );

      // Verify conversation summary updated
      expect(mockPrisma.smsConversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-456' },
          data: expect.objectContaining({
            lastMessageText: 'Hello from scheduled test',
          }),
        }),
      );
    });

    it('updates status to FAILED when provider adapter throws', async () => {
      mockPrisma.smsMessage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.smsMessage.findUnique.mockResolvedValue({
        id: 'sms-msg-fail',
        conversationId: 'conv-456',
        toPhone: '+14155552671',
        bodyText: 'Fail test',
        conversation: {
          id: 'conv-456',
          assignedProvider: 'TWILIO',
        },
      });

      const adapter = getSmsProvider('TWILIO');
      vi.spyOn(adapter, 'sendBatch').mockRejectedValue(new Error('Carrier network down'));

      const result = await dispatchScheduledMessage(mockPrisma, {
        channel: 'SMS',
        messageId: 'sms-msg-fail',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Carrier network down');

      expect(mockPrisma.smsMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sms-msg-fail' },
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'Carrier network down',
          }),
        }),
      );
    });
  });
});
