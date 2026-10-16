// ============================================================================
// BrokerOS — SMS Inbox Service (2-Way Team Inbox with Thread Continuity)
// ============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { SmsIntegrationsService } from './sms-integrations.service.js';
import { SmsAiService } from '../ai/sms-ai.service.js';
import { calculateSmsSegments } from '@brokeros/constants';
import { dispatchScheduledMessage } from '@brokeros/messaging';
import type {
  ListSmsConversationsQueryDto,
  StartSmsConversationDto,
  SendSmsReplyDto,
  ListSmsMessagesQueryDto,
  DraftSmsAiReplyDto,
  ScheduleSmsDto,
  RescheduleSmsDto,
  EditScheduledSmsDto,
} from '../dto/sms-inbox.dto.js';
import type { SmsProviderCredentials } from '@brokeros/types';

const SMS_CONVERSATION_INCLUDE = {
  agent: {
    select: { id: true, name: true, email: true },
  },
  lead: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      temperature: true,
      budget: true,
      score: true,
      interestedProject: {
        select: { id: true, name: true },
      },
    },
  },
  campaign: {
    select: { id: true, title: true },
  },
  broker: {
    select: { id: true, name: true, phone: true, email: true, status: true },
  },
  customer: {
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  },
  messages: {
    where: { status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' as const },
    take: 1,
    select: { id: true, scheduledAt: true, bodyText: true },
  },
};

@Injectable()
export class SmsInboxService {
  private readonly logger = new Logger(SmsInboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: SmsIntegrationsService,
    private readonly aiService: SmsAiService,
  ) { }

  /**
   * Auto-provision uncontacted leads and brokers who possess a phone number
   */
  async autoProvisionExecutiveConversations(
    userId: string,
    roleCode: string,
    defaultProvider: string,
  ) {
    try {
      if (['PRE_SALES', 'SALES_EXECUTIVE'].includes(roleCode)) {
        const unprovisionedLeads = await this.prisma.lead.findMany({
          where: {
            assignedUserId: userId,
            deletedAt: null,
            phone: { not: '' },
            smsConversations: { none: {} },
          },
          take: 40,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        });

        for (const lead of unprovisionedLeads) {
          if (!lead.phone || !lead.phone.trim()) continue;
          await this.prisma.smsConversation
            .create({
              data: {
                contactPhone: lead.phone.trim(),
                contactName:
                  `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
                  'Lead',
                leadId: lead.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
              },
            })
            .catch(() => null);
        }
      } else if (roleCode === 'SOURCING_MANAGER') {
        const unprovisionedBrokers = await this.prisma.broker.findMany({
          where: {
            sourcingManagerId: userId,
            deletedAt: null,
            phone: { not: '' },
            smsConversations: { none: {} },
          },
          take: 40,
          select: { id: true, name: true, phone: true },
        });

        for (const broker of unprovisionedBrokers) {
          if (!broker.phone || !broker.phone.trim()) continue;
          await this.prisma.smsConversation
            .create({
              data: {
                contactPhone: broker.phone.trim(),
                contactName: broker.name || 'Broker',
                brokerId: broker.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
              },
            })
            .catch(() => null);
        }
      } else if (roleCode === 'POST_SALES') {
        const assignedBookings = await this.prisma.booking.findMany({
          where: {
            assignedPostSalesId: userId,
            customer: {
              smsConversations: { none: {} },
              phone: { not: '' },
            },
          },
          take: 40,
          select: {
            customer: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        });

        for (const b of assignedBookings) {
          const customer = b.customer;
          if (!customer || !customer.phone || !customer.phone.trim()) continue;
          await this.prisma.smsConversation
            .create({
              data: {
                contactPhone: customer.phone.trim(),
                contactName:
                  `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                  'Customer',
                customerId: customer.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
              },
            })
            .catch(() => null);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Auto-provisioning executive SMS conversations skipped: ${err?.message}`,
      );
    }
  }

  /**
   * List paginated SMS conversations with role scoping, search, and contact qualification.
   */
  async listConversations(
    query: ListSmsConversationsQueryDto,
    currentUser?: { id: string; roleId?: string; role?: any; name?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    // Resolve Role Code of currentUser
    let roleCode: string | undefined = undefined;
    if (currentUser?.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: currentUser.roleId },
        select: { code: true },
      });
      roleCode = role?.code;
    } else if (currentUser?.role) {
      roleCode =
        typeof currentUser.role === 'string'
          ? currentUser.role
          : currentUser.role?.code;
    }

    const isMarketing = ['MARKETING', 'MARKETING_MANAGER'].includes(roleCode || '');

    // Get default SMS provider for assignedProvider continuity
    let defaultProviderName = 'TWILIO';
    const defaultIntegration = await this.prisma.smsIntegration.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { provider: true, fromSender: true },
    });
    if (defaultIntegration?.provider) {
      defaultProviderName = defaultIntegration.provider;
    }

    if (currentUser?.id && roleCode && !isMarketing) {
      await this.autoProvisionExecutiveConversations(
        currentUser.id,
        roleCode,
        defaultProviderName,
      );
    }

    const where: any = { isActive: true };

    if (query.status && ['open', 'pending', 'closed'].includes(query.status)) {
      where.status = query.status;
    }

    const andConditions: any[] = [];

    // Qualification invariant: Contact must have a phone number
    andConditions.push({
      contactPhone: { not: '' },
    });

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      andConditions.push({
        OR: [
          { contactPhone: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { lastMessageText: { contains: q, mode: 'insensitive' } },
          {
            lead: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
          {
            broker: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
          {
            customer: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    // Explicit entity scoping
    if (query.leadId) {
      where.leadId = query.leadId;
    }
    if (query.brokerId) {
      where.brokerId = query.brokerId;
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }

    // ── Role & Department Scoping ───────────────────────────────────────────
    const effectiveDept = (query.department || '').toUpperCase();
    const isExec = [
      'PRE_SALES',
      'SALES_EXECUTIVE',
      'POST_SALES',
      'CLOSING_MANAGER',
      'SOURCING_MANAGER',
    ].includes(roleCode || '');

    if (!isMarketing && (query.scope === 'my' || (isExec && query.scope !== 'all'))) {
      if (roleCode === 'PRE_SALES' || effectiveDept === 'PRE_SALES') {
        where.lead = { assignedUserId: currentUser?.id, deletedAt: null };
      } else if (
        roleCode === 'SALES_EXECUTIVE' ||
        effectiveDept === 'SALES_EXECUTIVE' ||
        effectiveDept === 'SALES'
      ) {
        where.lead = { assignedUserId: currentUser?.id, deletedAt: null };
      } else if (
        roleCode === 'CLOSING_MANAGER' ||
        effectiveDept === 'CLOSING_MANAGER'
      ) {
        andConditions.push({
          OR: [
            { lead: { createdById: currentUser?.id, deletedAt: null } },
            { lead: { assignedUserId: currentUser?.id, deletedAt: null } },
          ],
        });
      } else if (
        roleCode === 'SOURCING_MANAGER' ||
        effectiveDept === 'SOURCING_MANAGER'
      ) {
        where.broker = {
          sourcingManagerId: currentUser?.id,
        };
      } else if (
        roleCode === 'POST_SALES' ||
        effectiveDept === 'POST_SALES'
      ) {
        andConditions.push({
          OR: [
            {
              customer: {
                bookings: {
                  some: { assignedPostSalesId: currentUser?.id },
                },
              },
            },
            {
              lead: {
                assignedUserId: currentUser?.id,
                deletedAt: null,
              },
            },
          ],
        });
      }
    } else if (
      !isMarketing &&
      (query.scope === 'team' ||
        ['PRE_SALES_MANAGER', 'SALES_MANAGER', 'POST_SALES_MANAGER'].includes(
          roleCode || '',
        ))
    ) {
      const targetAgentId = query.agentId;
      if (targetAgentId) {
        andConditions.push({
          OR: [
            { lead: { assignedUserId: targetAgentId } },
            { agentUserId: targetAgentId },
            { broker: { sourcingManagerId: targetAgentId } },
          ],
        });
      } else if (currentUser?.id) {
        const subordinates = await this.prisma.user.findMany({
          where: { managerId: currentUser.id },
          select: { id: true },
        });
        const subIds = subordinates.map((s) => s.id);
        subIds.push(currentUser.id);

        andConditions.push({
          OR: [
            { lead: { assignedUserId: { in: subIds } } },
            { agentUserId: { in: subIds } },
            { broker: { sourcingManagerId: { in: subIds } } },
          ],
        });
      }
    } else if (
      !isMarketing &&
      ['BUSINESS_MANAGER', 'DIRECTOR', 'FINANCE', 'ADMIN'].includes(roleCode || '')
    ) {
      // Full cross-enterprise visibility; no restrictive user filter
      if (query.agentId) {
        andConditions.push({
          OR: [
            { lead: { assignedUserId: query.agentId } },
            { agentUserId: query.agentId },
            { broker: { sourcingManagerId: query.agentId } },
          ],
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      this.prisma.smsConversation.findMany({
        where,
        include: SMS_CONVERSATION_INCLUDE,
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.smsConversation.count({ where }),
    ]);

    const mappedItems = items.map((item: any) => ({
      ...item,
      nextScheduledAt: item.messages?.[0]?.scheduledAt || null,
      scheduledCount: item.messages?.length || 0,
    }));

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single conversation by ID
   */
  async getConversation(id: string) {
    const conv = await this.prisma.smsConversation.findUnique({
      where: { id },
      include: SMS_CONVERSATION_INCLUDE,
    });

    if (!conv) {
      throw new NotFoundException(`SMS conversation #${id} not found`);
    }

    return conv;
  }

  /**
   * Get chronological messages in conversation
   */
  async getMessages(conversationId: string, query?: ListSmsMessagesQueryDto) {
    const conv = await this.prisma.smsConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException(
        `SMS conversation #${conversationId} not found`,
      );
    }

    const messages = await this.prisma.smsMessage.findMany({
      where: {
        conversationId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      conversationId,
      items: messages,
      total: messages.length,
    };
  }

  /**
   * Start a new conversation or return existing active one
   */
  async startConversation(
    dto: StartSmsConversationDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const contactPhone = dto.contactPhone.trim();

    let lead: any = null;
    if (dto.leadId) {
      lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    }

    const contactName =
      dto.contactName ||
      (lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '') ||
      contactPhone;

    const existing = await this.prisma.smsConversation.findFirst({
      where: {
        contactPhone,
        isActive: true,
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lead: true,
      },
    });

    if (existing) {
      if (dto.initialMessage?.trim()) {
        await this.sendReply(
          existing.id,
          { text: dto.initialMessage.trim() },
          senderUser,
        );
      }
      return existing;
    }

    // Resolve default provider and sender number if not specified
    let provider = dto.assignedProvider;
    let senderPhone = dto.assignedSenderPhone || dto.assignedSenderId;

    if (!senderPhone || !provider) {
      const activeIntegration = await this.prisma.smsIntegration.findFirst({
        where: { isActive: true },
        include: {
          senderNumbers: {
            where: { isVerified: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      if (activeIntegration) {
        provider = provider || activeIntegration.provider;
        senderPhone =
          senderPhone ||
          activeIntegration.senderNumbers[0]?.phoneNumber ||
          activeIntegration.senderNumbers[0]?.senderId ||
          activeIntegration.fromSender;
      }
    }

    if (!provider || !senderPhone) {
      throw new BadRequestException(
        'No active SMS integration with verified sender number found. Please configure an SMS gateway in Settings.',
      );
    }

    const created = await this.prisma.smsConversation.create({
      data: {
        contactPhone,
        contactName,
        leadId: dto.leadId || lead?.id || null,
        agentUserId: senderUser?.id || null,
        assignedProvider: provider,
        assignedSenderPhone: senderPhone,
        status: 'open',
        unreadCount: 0,
        lastMessageText:
          dto.initialMessage?.slice(0, 150) || 'Conversation started',
        lastMessageAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lead: true,
      },
    });

    if (dto.initialMessage?.trim()) {
      await this.sendReply(
        created.id,
        { text: dto.initialMessage.trim() },
        senderUser,
      );
    }

    return created;
  }

  /**
   * Send 2-way outbound reply strictly adhering to the Thread Continuity Invariant.
   * Dispatches strictly via the conversation's assignedProvider and assignedSenderPhone.
   */
  async sendReply(
    conversationId: string,
    dto: SendSmsReplyDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const conv = await this.prisma.smsConversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    });

    if (!conv) {
      throw new NotFoundException(
        `SMS Conversation #${conversationId} not found`,
      );
    }

    let textContent = dto.text?.trim() || '';
    if (dto.mediaUrl && !textContent.includes(dto.mediaUrl)) {
      textContent = textContent
        ? `${textContent}\n${dto.mediaUrl}`
        : dto.mediaUrl;
    }
    if (!textContent) {
      throw new BadRequestException('Message text or media cannot be empty');
    }

    const provider = conv.assignedProvider;
    let fromPhone: string | null | undefined = conv.assignedSenderPhone;

    if (!fromPhone) {
      const activeIntegration = await this.prisma.smsIntegration.findFirst({
        where: {
          ...(provider ? { provider: provider as any } : {}),
          isActive: true,
        },
        include: {
          senderNumbers: {
            where: { isVerified: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      fromPhone =
        activeIntegration?.senderNumbers[0]?.phoneNumber ||
        activeIntegration?.senderNumbers[0]?.senderId ||
        activeIntegration?.fromSender ||
        null;
    }

    if (!fromPhone || !provider) {
      throw new BadRequestException(
        `No active verified sender phone found for SMS gateway ${provider || 'UNKNOWN'}.`,
      );
    }
    const fromName = senderUser?.name || 'Sales Team';

    const { segments } = calculateSmsSegments(textContent);

    // Resolve provider credentials for the dedicated provider
    let credentials: SmsProviderCredentials | undefined;
    const integration = await this.prisma.smsIntegration.findFirst({
      where: { provider: provider as any, isActive: true },
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

    let providerMsgId: string | null = null;
    try {
      const adapter = this.integrationsService.getAdapter(provider);
      const sendRes = await adapter.sendBatch(
        {
          from: fromPhone,
          to: [
            { phone: conv.contactPhone, name: conv.contactName || undefined },
          ],
          message: textContent,
        },
        credentials,
      );

      providerMsgId = sendRes.providerMessageId || null;
      this.logger.log(
        `Inbox Outbound SMS dispatched via ${provider}: to=${conv.contactPhone} msgId=${providerMsgId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to dispatch SMS via ${provider}: ${err.message}`,
      );
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(`SMS delivery failed: ${err.message}`);
      }
    }

    const createdMessage = await this.prisma.smsMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'agent',
        senderName: fromName,
        fromPhone,
        toPhone: conv.contactPhone,
        bodyText: textContent,
        segmentsCount: segments,
        status: providerMsgId ? 'DELIVERED' : 'SENT',
        provider,
        providerMsgId: providerMsgId || `local-${Date.now()}`,
        sentAt: new Date(),
        deliveredAt: providerMsgId ? new Date() : null,
      },
    });

    await this.prisma.smsConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: textContent.slice(0, 160),
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
    });

    return createdMessage;
  }

  async updateStatus(id: string, status: 'open' | 'pending' | 'closed') {
    return this.prisma.smsConversation.update({
      where: { id },
      data: { status },
      include: SMS_CONVERSATION_INCLUDE,
    });
  }

  async assignAgent(id: string, agentUserId: string | null) {
    return this.prisma.smsConversation.update({
      where: { id },
      data: { agentUserId },
      include: SMS_CONVERSATION_INCLUDE,
    });
  }

  async toggleAiAutoReply(id: string, disabled: boolean) {
    return this.prisma.smsConversation.update({
      where: { id },
      data: { aiAutoReplyDisabled: disabled },
      include: SMS_CONVERSATION_INCLUDE,
    });
  }

  async markRead(id: string) {
    return this.prisma.smsConversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  async draftAiReply(conversationId: string, dto?: DraftSmsAiReplyDto) {
    const conv = await this.prisma.smsConversation.findUnique({
      where: { id: conversationId },
      include: {
        agent: true,
        campaign: true,
        lead: {
          include: {
            interestedProject: true,
            assignedUser: true,
          },
        },
      },
    });

    if (!conv) {
      throw new NotFoundException(
        `SMS Conversation #${conversationId} not found`,
      );
    }

    const recentMessages = await this.prisma.smsMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const chronological = [...recentMessages].reverse();

    const leadName =
      dto?.leadName ||
      conv.contactName ||
      (conv.lead
        ? `${conv.lead.firstName || ''} ${conv.lead.lastName || ''}`.trim()
        : '') ||
      'Prospect';

    const advisorName =
      dto?.agentName ||
      conv.agent?.name ||
      conv.lead?.assignedUser?.name ||
      'Property Advisory Consultant';

    const campaignTitle =
      conv.campaign?.title ||
      conv.lead?.interestedProject?.name ||
      'Luxury Residences';

    const aiRes = await this.aiService.generateAutoreply({
      leadName,
      advisorName,
      originalCampaignTitle: campaignTitle,
      project: conv.lead?.interestedProject
        ? {
          name: conv.lead.interestedProject.name,
          city: conv.lead.interestedProject.city || undefined,
          description: conv.lead.interestedProject.description || undefined,
        }
        : null,
      messages: chronological.map((m) => ({
        direction: m.direction,
        text: m.bodyText,
        senderName: m.senderName || undefined,
      })),
      customInstructions: dto?.instruction,
    });

    return {
      text: aiRes.text,
      modelUsed: aiRes.modelUsed,
    };
  }

  /**
   * Schedule an SMS reply for future delivery
   */
  async scheduleMessage(
    conversationId: string,
    dto: ScheduleSmsDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const conv = await this.prisma.smsConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException(`SMS Conversation #${conversationId} not found`);
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
      throw new BadRequestException('Scheduled time must be at least 10 seconds in the future');
    }

    let textContent = dto.text?.trim() || '';
    if (dto.mediaUrl && !textContent.includes(dto.mediaUrl)) {
      textContent = textContent ? `${textContent}\n${dto.mediaUrl}` : dto.mediaUrl;
    }
    if (!textContent) {
      throw new BadRequestException('Message text cannot be empty');
    }

    const provider = conv.assignedProvider;
    const fromPhone = conv.assignedSenderPhone;
    const fromName = senderUser?.name || 'Sales Team';
    const { segments } = calculateSmsSegments(textContent);

    const scheduledMessage = await this.prisma.smsMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'agent',
        senderName: fromName,
        fromPhone: fromPhone || '',
        toPhone: conv.contactPhone,
        bodyText: textContent,
        segmentsCount: segments,
        status: 'SCHEDULED',
        provider,
        scheduledAt: scheduledDate,
        scheduledBy: senderUser?.id || null,
        isScheduled: true,
      },
    });

    return scheduledMessage;
  }

  /**
   * Get all pending scheduled SMS messages for a conversation
   */
  async getScheduledMessages(conversationId: string) {
    return this.prisma.smsMessage.findMany({
      where: {
        conversationId,
        status: 'SCHEDULED',
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Reschedule an existing scheduled SMS message
   */
  async rescheduleMessage(messageId: string, newScheduledAt: string) {
    const msg = await this.prisma.smsMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled SMS message #${messageId} not found`);
    }

    const scheduledDate = new Date(newScheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    return this.prisma.smsMessage.update({
      where: { id: messageId },
      data: { scheduledAt: scheduledDate },
    });
  }

  /**
   * Edit content and/or date of a scheduled SMS message
   */
  async editScheduledMessage(messageId: string, dto: EditScheduledSmsDto) {
    const msg = await this.prisma.smsMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled SMS message #${messageId} not found`);
    }

    const data: any = {};
    if (dto.text?.trim()) {
      let textContent = dto.text.trim();
      if (dto.mediaUrl && !textContent.includes(dto.mediaUrl)) {
        textContent = `${textContent}\n${dto.mediaUrl}`;
      }
      data.bodyText = textContent;
      const { segments } = calculateSmsSegments(textContent);
      data.segmentsCount = segments;
    }
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
        throw new BadRequestException('Scheduled time must be in the future');
      }
      data.scheduledAt = scheduledDate;
    }

    return this.prisma.smsMessage.update({
      where: { id: messageId },
      data,
    });
  }

  /**
   * Cancel a scheduled SMS message
   */
  async cancelScheduledMessage(messageId: string) {
    const msg = await this.prisma.smsMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled SMS message #${messageId} not found`);
    }

    return this.prisma.smsMessage.update({
      where: { id: messageId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Immediately dispatch a scheduled SMS message
   */
  async sendScheduledMessageNow(
    messageId: string,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const res = await dispatchScheduledMessage(this.prisma, {
      channel: 'SMS',
      messageId,
      triggeredBy: senderUser?.id,
    });

    if (!res.success) {
      if (res.alreadyProcessed) {
        throw new BadRequestException('Message is already processing or sent');
      }
      throw new BadRequestException(res.error || 'Failed to dispatch scheduled SMS');
    }

    return this.prisma.smsMessage.findUnique({
      where: { id: messageId },
    });
  }
}

