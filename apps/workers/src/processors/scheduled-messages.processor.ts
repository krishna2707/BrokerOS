// ============================================================================
// BrokerOS — Scheduled Messages Processor (WhatsApp, SMS, Email Inboxes)
// ============================================================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prismaClient } from '@brokeros/prisma';
import { TwilioSmsAdapter } from '@brokeros/int-sms-twilio';
import { AwsSnsSmsAdapter } from '@brokeros/int-sms-aws-sns';
import { SinchSmsAdapter } from '@brokeros/int-sms-sinch';
import { GupshupSmsAdapter } from '@brokeros/int-sms-gupshup';
import { InfobipSmsAdapter } from '@brokeros/int-sms-infobip';
import { VonageSmsAdapter } from '@brokeros/int-sms-vonage';
import { TelnyxSmsAdapter } from '@brokeros/int-sms-telnyx';
import { PlivoSmsAdapter } from '@brokeros/int-sms-plivo';
import { BirdSmsAdapter } from '@brokeros/int-sms-bird';

import { SesAdapter } from '@brokeros/int-mail-ses';
import { SendgridAdapter } from '@brokeros/int-mail-sendgrid';
import { BrevoAdapter } from '@brokeros/int-mail-brevo';
import { MailchimpAdapter } from '@brokeros/int-mail-mailchimp';
import { MailgunAdapter } from '@brokeros/int-mail-mailgun';
import { GmailAdapter } from '@brokeros/int-mail-gmail';
import { OutlookAdapter } from '@brokeros/int-mail-outlook';
import { ConstantContactAdapter } from '@brokeros/int-mail-constant-contact';

import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  sanitizePhoneForMeta,
} from '@brokeros/int-whatsapp';

import type {
  ISmsMarketingProvider,
  IEmailMarketingProvider,
  SmsProviderCredentials,
  ProviderCredentials,
} from '@brokeros/types';

@Injectable()
export class ScheduledMessagesProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledMessagesProcessor.name);
  private readonly prisma = prismaClient;
  private isScanning = false;
  private scanInterval: NodeJS.Timeout | null = null;

  // SMS Adapters
  private readonly smsAdapters: Record<string, ISmsMarketingProvider> = {
    TWILIO: new TwilioSmsAdapter(),
    AWS_SNS: new AwsSnsSmsAdapter(),
    SINCH: new SinchSmsAdapter(),
    GUPSHUP: new GupshupSmsAdapter(),
    INFOBIP: new InfobipSmsAdapter(),
    VONAGE: new VonageSmsAdapter(),
    TELNYX: new TelnyxSmsAdapter(),
    PLIVO: new PlivoSmsAdapter(),
    BIRD: new BirdSmsAdapter(),
  };

  // Email Adapters
  private readonly emailAdapters: Record<string, IEmailMarketingProvider> = {
    AWS_SES: new SesAdapter(),
    SENDGRID: new SendgridAdapter(),
    BREVO: new BrevoAdapter(),
    MAILCHIMP: new MailchimpAdapter(),
    MAILGUN: new MailgunAdapter(),
    GMAIL: new GmailAdapter(),
    OUTLOOK: new OutlookAdapter(),
    CONSTANT_CONTACT: new ConstantContactAdapter(),
  };

  onModuleInit() {
    this.logger.log('ScheduledMessagesProcessor background scanner started.');
    // Initial scan after boot
    setTimeout(() => this.scanAndDispatchScheduledMessages(), 4000);
    // Interval check every 10 seconds
    this.scanInterval = setInterval(() => this.scanAndDispatchScheduledMessages(), 10000);
  }

  onModuleDestroy() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /**
   * Main scan loop: checks SMS, Email, and WhatsApp scheduled queues
   */
  async scanAndDispatchScheduledMessages(): Promise<void> {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      await Promise.all([
        this.dispatchDueSms(),
        this.dispatchDueEmail(),
        this.dispatchDueWhatsApp(),
      ]);
    } catch (err: any) {
      this.logger.error(`ScheduledMessages scanner error: ${err?.message}`);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * 1. Dispatch Due Scheduled SMS Messages
   */
  private async dispatchDueSms(): Promise<void> {
    const dueMessages = await this.prisma.smsMessage.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      take: 15,
      include: {
        conversation: true,
      },
    });

    for (const msg of dueMessages) {
      // Atomic reservation to prevent race conditions across worker instances
      const reserved = await this.prisma.smsMessage.updateMany({
        where: { id: msg.id, status: 'SCHEDULED' },
        data: { status: 'PROCESSING' },
      });

      if (reserved.count === 0) continue;

      try {
        const providerName = msg.provider || msg.conversation.assignedProvider || 'TWILIO';
        const fromPhone = msg.fromPhone || msg.conversation.assignedSenderPhone || '';

        // Resolve credentials
        let credentials: SmsProviderCredentials | undefined;
        const integration = await this.prisma.smsIntegration.findFirst({
          where: { provider: providerName as any, isActive: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        if (integration) {
          credentials = {
            accountSid: integration.accountSid || undefined,
            authToken: integration.authToken || undefined,
            messagingServiceSid: integration.messagingServiceSid || undefined,
            apiKey: integration.apiKey || undefined,
            servicePlanId: integration.servicePlanId || undefined,
            awsAccessKeyId: integration.awsAccessKeyId || undefined,
            awsSecretKey: integration.awsSecretKey || undefined,
            awsRegion: integration.awsRegion || undefined,
            dltEntityId: integration.dltEntityId || undefined,
            fromNumber: fromPhone,
            senderId: fromPhone,
          };
        }

        const adapter = this.smsAdapters[providerName] || this.smsAdapters.TWILIO;
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

        // Mark sent
        await this.prisma.smsMessage.update({
          where: { id: msg.id },
          data: {
            status: providerMsgId ? 'DELIVERED' : 'SENT',
            providerMsgId: providerMsgId || `scheduled-${Date.now()}`,
            sentAt: new Date(),
            deliveredAt: providerMsgId ? new Date() : null,
          },
        });

        // Update conversation summary
        await this.prisma.smsConversation.update({
          where: { id: msg.conversationId },
          data: {
            lastMessageText: msg.bodyText.slice(0, 160),
            lastMessageAt: new Date(),
          },
        });

        this.logger.log(`Scheduled SMS #${msg.id} dispatched successfully to ${msg.toPhone}`);
      } catch (err: any) {
        this.logger.error(`Failed to dispatch scheduled SMS #${msg.id}: ${err.message}`);
        await this.prisma.smsMessage.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: err.message,
          },
        });
      }
    }
  }

  /**
   * 2. Dispatch Due Scheduled Email Messages
   */
  private async dispatchDueEmail(): Promise<void> {
    const dueMessages = await this.prisma.emailMessage.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      take: 15,
      include: {
        conversation: true,
      },
    });

    for (const msg of dueMessages) {
      const reserved = await this.prisma.emailMessage.updateMany({
        where: { id: msg.id, status: 'SCHEDULED' },
        data: { status: 'PROCESSING' },
      });

      if (reserved.count === 0) continue;

      try {
        const providerName = msg.provider || msg.conversation.assignedProvider || 'AWS_SES';
        const fromEmail = msg.fromEmail || msg.conversation.assignedSenderEmail || 'sales@brokeros.com';
        const fromName = msg.senderName || msg.conversation.assignedSenderName || 'Sales Team';

        let credentials: ProviderCredentials | undefined;
        if (providerName !== 'SYSTEM_DEFAULT') {
          const integration = await this.prisma.marketingIntegration.findFirst({
            where: { provider: providerName as any, isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          });
          if (integration) {
            credentials = {
              apiKey: integration.apiKey || undefined,
              awsAccessKeyId: integration.awsAccessKeyId || undefined,
              awsSecretKey: integration.awsSecretKey || undefined,
              awsRegion: integration.awsRegion || undefined,
              mailchimpServer: integration.mailchimpServer || undefined,
              mailgunDomain: integration.mailgunDomain || undefined,
              mailgunRegion: (integration.mailgunRegion as 'US' | 'EU') || undefined,
              oauthClientId: integration.oauthClientId || undefined,
              oauthClientSecret: integration.oauthClientSecret || undefined,
              oauthRefreshToken: integration.oauthRefreshToken || undefined,
              oauthTenantId: integration.oauthTenantId || undefined,
              googleAppPassword: integration.googleAppPassword || undefined,
              fromEmail,
              fromName,
            };
          }
        }

        const adapter = this.emailAdapters[providerName] || this.emailAdapters.AWS_SES;
        let providerMsgId: string | null = null;

        if (adapter) {
          const attachments = Array.isArray(msg.attachments)
            ? (msg.attachments as any[]).map((att) => ({
              filename: att.name,
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

        // Mark sent
        await this.prisma.emailMessage.update({
          where: { id: msg.id },
          data: {
            status: providerMsgId ? 'DELIVERED' : 'SENT',
            providerMsgId: providerMsgId || `scheduled-email-${Date.now()}`,
            sentAt: new Date(),
            deliveredAt: providerMsgId ? new Date() : null,
          },
        });

        // Update conversation summary
        await this.prisma.emailConversation.update({
          where: { id: msg.conversationId },
          data: {
            lastMessageText: (msg.bodyText || msg.subject || 'Email reply').slice(0, 180),
            lastMessageAt: new Date(),
          },
        });

        this.logger.log(`Scheduled Email #${msg.id} dispatched successfully to ${msg.toEmail}`);
      } catch (err: any) {
        this.logger.error(`Failed to dispatch scheduled Email #${msg.id}: ${err.message}`);
        await this.prisma.emailMessage.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: err.message,
          },
        });
      }
    }
  }

  /**
   * 3. Dispatch Due Scheduled WhatsApp Messages
   */
  private async dispatchDueWhatsApp(): Promise<void> {
    const dueMessages = await this.prisma.whatsAppMessage.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      take: 15,
      include: {
        conversation: true,
        template: true,
      },
    });

    for (const msg of dueMessages) {
      const reserved = await this.prisma.whatsAppMessage.updateMany({
        where: { id: msg.id, status: 'SCHEDULED' },
        data: { status: 'PROCESSING' },
      });

      if (reserved.count === 0) continue;

      try {
        const account = await this.prisma.whatsAppBusinessAccount.findUnique({
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

        await this.prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: 'SENT',
            waMessageId: metaMsgId || `scheduled-wa-${Date.now()}`,
            sentAt: new Date(),
          },
        });

        await this.prisma.whatsAppConversation.update({
          where: { id: msg.conversationId },
          data: {
            lastMessageText: (msg.body || msg.caption || `[${msg.type}]`).slice(0, 160),
            lastMessageAt: new Date(),
          },
        });

        this.logger.log(`Scheduled WhatsApp #${msg.id} dispatched successfully to ${targetPhone}`);
      } catch (err: any) {
        this.logger.error(`Failed to dispatch scheduled WhatsApp #${msg.id}: ${err.message}`);
        await this.prisma.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: err.message,
          },
        });
      }
    }
  }
}
