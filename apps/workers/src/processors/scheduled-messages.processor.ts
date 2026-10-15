// ============================================================================
// BrokerOS — Scheduled Messages Processor (WhatsApp, SMS, Email Inboxes)
// ============================================================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prismaClient } from '@brokeros/prisma';
import { dispatchScheduledMessage } from '@brokeros/messaging';

@Injectable()
export class ScheduledMessagesProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledMessagesProcessor.name);
  private readonly prisma = prismaClient;
  private isScanning = false;
  private scanInterval: NodeJS.Timeout | null = null;

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
      select: { id: true },
    });

    for (const msg of dueMessages) {
      const result = await dispatchScheduledMessage(this.prisma, {
        channel: 'SMS',
        messageId: msg.id,
      });
      if (result.success) {
        this.logger.log(`Scheduled SMS #${msg.id} dispatched successfully (msgId=${result.providerMsgId})`);
      } else if (!result.alreadyProcessed) {
        this.logger.error(`Failed to dispatch scheduled SMS #${msg.id}: ${result.error}`);
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
      select: { id: true },
    });

    for (const msg of dueMessages) {
      const result = await dispatchScheduledMessage(this.prisma, {
        channel: 'EMAIL',
        messageId: msg.id,
      });
      if (result.success) {
        this.logger.log(`Scheduled Email #${msg.id} dispatched successfully (msgId=${result.providerMsgId})`);
      } else if (!result.alreadyProcessed) {
        this.logger.error(`Failed to dispatch scheduled Email #${msg.id}: ${result.error}`);
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
      select: { id: true },
    });

    for (const msg of dueMessages) {
      const result = await dispatchScheduledMessage(this.prisma, {
        channel: 'WHATSAPP',
        messageId: msg.id,
      });
      if (result.success) {
        this.logger.log(`Scheduled WhatsApp #${msg.id} dispatched successfully (msgId=${result.providerMsgId})`);
      } else if (!result.alreadyProcessed) {
        this.logger.error(`Failed to dispatch scheduled WhatsApp #${msg.id}: ${result.error}`);
      }
    }
  }
}
