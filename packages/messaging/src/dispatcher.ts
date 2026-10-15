// ============================================================================
// BrokerOS — Deep Message Dispatcher Module (SMS, Email, WhatsApp)
// ============================================================================

import type { PrismaClient } from '@brokeros/prisma';
import { getSmsProvider } from './providers/sms-registry.js';
import { getEmailProvider } from './providers/email-registry.js';
import { resolveSmsCredentials } from './credentials/sms-credentials.js';
import { resolveEmailCredentials } from './credentials/email-credentials.js';
import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  sanitizePhoneForMeta,
} from '@brokeros/int-whatsapp';

export type MessagingChannel = 'SMS' | 'EMAIL' | 'WHATSAPP';

export interface DispatchScheduledMessageOptions {
  channel: MessagingChannel;
  messageId: string;
  triggeredBy?: string;
}

export interface DispatchResult {
  success: boolean;
  messageId: string;
  channel: MessagingChannel;
  providerMsgId?: string | null;
  error?: string;
  alreadyProcessed?: boolean;
}

export interface DispatchDirectSmsOptions {
  conversationId: string;
  text: string;
  mediaUrl?: string;
  senderUser?: { id: string; name?: string; email?: string };
}

export interface DispatchDirectEmailOptions {
  conversationId: string;
  text?: string;
  html?: string;
  subject?: string;
  attachments?: Array<{
    name: string;
    url: string;
    contentType?: string;
    size?: number;
  }>;
  senderUser?: { id: string; name?: string; email?: string };
}

/**
 * Dispatches a single scheduled message by ID with atomic row reservation lock.
 * Prevents race conditions between background interval scanners and manual user sends.
 */
export async function dispatchScheduledMessage(
  prisma: PrismaClient,
  opts: DispatchScheduledMessageOptions,
): Promise<DispatchResult> {
  const { channel, messageId } = opts;

  switch (channel) {
    case 'SMS':
      return dispatchScheduledSms(prisma, messageId);
    case 'EMAIL':
      return dispatchScheduledEmail(prisma, messageId);
    case 'WHATSAPP':
      return dispatchScheduledWhatsApp(prisma, messageId);
    default:
      return {
        success: false,
        messageId,
        channel,
        error: `Unsupported messaging channel: ${channel}`,
      };
  }
}

/**
 * 1. Scheduled SMS Dispatch with Atomic Reservation
 */
async function dispatchScheduledSms(
  prisma: PrismaClient,
  messageId: string,
): Promise<DispatchResult> {
  // Atomic reservation to lock row across worker and API instances
  const reserved = await prisma.smsMessage.updateMany({
    where: { id: messageId, status: 'SCHEDULED' },
    data: { status: 'PROCESSING' },
  });

  if (reserved.count === 0) {
    return {
      success: false,
      messageId,
      channel: 'SMS',
      alreadyProcessed: true,
      error: 'Message already processing or sent',
    };
  }

  const msg = await prisma.smsMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!msg || !msg.conversation) {
    return {
      success: false,
      messageId,
      channel: 'SMS',
      error: 'Message or associated conversation record not found',
    };
  }

  try {
    const providerName = msg.provider || msg.conversation.assignedProvider || 'TWILIO';
    const fromPhone = msg.fromPhone || msg.conversation.assignedSenderPhone || '';
    const credentials = await resolveSmsCredentials(prisma, providerName, fromPhone);
    const adapter = getSmsProvider(providerName);

    let providerMsgId: string | null = null;
    if (adapter) {
      const res = await adapter.sendBatch(
        {
          from: fromPhone,
          to: [{ phone: msg.toPhone, name: msg.conversation.contactName || undefined }],
          message: msg.bodyText,
        },
        credentials,
      );
      providerMsgId = res.providerMessageId || null;
    }

    // In-place atomic transition
    await prisma.smsMessage.update({
      where: { id: msg.id },
      data: {
        status: providerMsgId ? 'DELIVERED' : 'SENT',
        providerMsgId: providerMsgId || `scheduled-sms-${Date.now()}`,
        sentAt: new Date(),
        deliveredAt: providerMsgId ? new Date() : null,
      },
    });

    // Update conversation audit summary
    await prisma.smsConversation.update({
      where: { id: msg.conversationId },
      data: {
        lastMessageText: msg.bodyText.slice(0, 160),
        lastMessageAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: msg.id,
      channel: 'SMS',
      providerMsgId,
    };
  } catch (err: any) {
    await prisma.smsMessage.update({
      where: { id: msg.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: err?.message || 'Dispatch error',
      },
    });

    return {
      success: false,
      messageId: msg.id,
      channel: 'SMS',
      error: err?.message || 'SMS delivery failed',
    };
  }
}

/**
 * 2. Scheduled Email Dispatch with Atomic Reservation
 */
async function dispatchScheduledEmail(
  prisma: PrismaClient,
  messageId: string,
): Promise<DispatchResult> {
  const reserved = await prisma.emailMessage.updateMany({
    where: { id: messageId, status: 'SCHEDULED' },
    data: { status: 'PROCESSING' },
  });

  if (reserved.count === 0) {
    return {
      success: false,
      messageId,
      channel: 'EMAIL',
      alreadyProcessed: true,
      error: 'Email already processing or sent',
    };
  }

  const msg = await prisma.emailMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!msg || !msg.conversation) {
    return {
      success: false,
      messageId,
      channel: 'EMAIL',
      error: 'Email or associated conversation record not found',
    };
  }

  try {
    const providerName = msg.provider || msg.conversation.assignedProvider || 'AWS_SES';
    const fromEmail = msg.fromEmail || msg.conversation.assignedSenderEmail || 'sales@brokeros.com';
    const fromName = msg.senderName || msg.conversation.assignedSenderName || 'Sales Team';

    const credentials = await resolveEmailCredentials(prisma, providerName, fromEmail, fromName);
    const adapter = getEmailProvider(providerName);

    let providerMsgId: string | null = null;
    if (adapter) {
      const attachments = Array.isArray(msg.attachments)
        ? (msg.attachments as any[]).map((att) => ({
            filename: att.name || att.filename,
            content: att.url,
            contentType: att.contentType || 'application/octet-stream',
          }))
        : undefined;

      const res = await adapter.sendBatch(
        {
          fromEmail,
          fromName,
          replyTo: msg.conversation.assignedSenderEmail || undefined,
          to: [{ email: msg.toEmail, name: msg.conversation.contactName || undefined }],
          subject: msg.subject || 'Inquiry',
          htmlContent: msg.bodyHtml || msg.bodyText || '',
          plainTextContent: msg.bodyText || undefined,
          attachments,
        },
        credentials,
      );
      providerMsgId = res.providerMessageId || null;
    }

    await prisma.emailMessage.update({
      where: { id: msg.id },
      data: {
        status: providerMsgId ? 'DELIVERED' : 'SENT',
        providerMsgId: providerMsgId || `scheduled-email-${Date.now()}`,
        sentAt: new Date(),
        deliveredAt: providerMsgId ? new Date() : null,
      },
    });

    await prisma.emailConversation.update({
      where: { id: msg.conversationId },
      data: {
        lastMessageText: (msg.bodyText || msg.subject || 'Email reply').slice(0, 180),
        lastMessageAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: msg.id,
      channel: 'EMAIL',
      providerMsgId,
    };
  } catch (err: any) {
    await prisma.emailMessage.update({
      where: { id: msg.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: err?.message || 'Email dispatch error',
      },
    });

    return {
      success: false,
      messageId: msg.id,
      channel: 'EMAIL',
      error: err?.message || 'Email delivery failed',
    };
  }
}

/**
 * 3. Scheduled WhatsApp Dispatch with Atomic Reservation
 */
async function dispatchScheduledWhatsApp(
  prisma: PrismaClient,
  messageId: string,
): Promise<DispatchResult> {
  const reserved = await prisma.whatsAppMessage.updateMany({
    where: { id: messageId, status: 'SCHEDULED' },
    data: { status: 'PROCESSING' },
  });

  if (reserved.count === 0) {
    return {
      success: false,
      messageId,
      channel: 'WHATSAPP',
      alreadyProcessed: true,
      error: 'WhatsApp message already processing or sent',
    };
  }

  const msg = await prisma.whatsAppMessage.findUnique({
    where: { id: messageId },
    include: { conversation: true, template: true },
  });

  if (!msg || !msg.conversation) {
    return {
      success: false,
      messageId,
      channel: 'WHATSAPP',
      error: 'WhatsApp message or conversation not found',
    };
  }

  try {
    const account = await prisma.whatsAppBusinessAccount.findUnique({
      where: { id: msg.conversation.accountId },
    });

    if (!account) {
      throw new Error(`WhatsApp Business Account #${msg.conversation.accountId} not found`);
    }

    const targetPhone = sanitizePhoneForMeta(msg.conversation.contactPhone);
    let metaMsgId: string | undefined;

    if (msg.type === 'TEMPLATE' && msg.template?.name) {
      const components: any[] = [];
      if (Array.isArray(msg.templateValues) && msg.templateValues.length > 0) {
        components.push({
          type: 'body',
          parameters: (msg.templateValues as any[]).map((val) => ({
            type: 'text',
            text: String(val),
          })),
        });
      }

      const res = await sendTemplateMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: account.accessToken,
        to: targetPhone,
        templateName: msg.template.name,
        language: msg.template.language || 'en_US',
        components: components.length > 0 ? components : undefined,
      });
      metaMsgId = res.messageId;
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'].includes(msg.type) && msg.mediaUrl) {
      const res = await sendMediaMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: account.accessToken,
        to: targetPhone,
        kind: msg.type.toLowerCase() as any,
        link: msg.mediaUrl,
        caption: msg.caption || undefined,
        filename: msg.fileName || undefined,
      });
      metaMsgId = res.messageId;
    } else {
      const res = await sendTextMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: account.accessToken,
        to: targetPhone,
        text: msg.body || '',
      });
      metaMsgId = res.messageId;
    }

    await prisma.whatsAppMessage.update({
      where: { id: msg.id },
      data: {
        status: 'SENT',
        waMessageId: metaMsgId || `scheduled-wa-${Date.now()}`,
        sentAt: new Date(),
      },
    });

    await prisma.whatsAppConversation.update({
      where: { id: msg.conversationId },
      data: {
        lastMessageText: (msg.body || msg.caption || `[${msg.type}]`).slice(0, 160),
        lastMessageAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: msg.id,
      channel: 'WHATSAPP',
      providerMsgId: metaMsgId,
    };
  } catch (err: any) {
    await prisma.whatsAppMessage.update({
      where: { id: msg.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: err?.message || 'WhatsApp dispatch error',
      },
    });

    return {
      success: false,
      messageId: msg.id,
      channel: 'WHATSAPP',
      error: err?.message || 'WhatsApp delivery failed',
    };
  }
}
