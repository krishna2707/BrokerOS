// ============================================================================
// BrokerOS — Email Inbox Service (2-Way Team Inbox with Thread Continuity)
// ============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { EmailIntegrationsService } from './email-integrations.service.js';
import { EmailAiService } from '../ai/email-ai.service.js';
import { dispatchScheduledMessage } from '@brokeros/messaging';
import type {
  ListEmailConversationsQueryDto,
  StartEmailConversationDto,
  SendEmailReplyDto,
  ListEmailMessagesQueryDto,
  DraftEmailAiReplyDto,
  ScheduleEmailDto,
  RescheduleEmailDto,
  EditScheduledEmailDto,
} from '../dto/email-inbox.dto.js';
import type { ProviderCredentials } from '@brokeros/types';

const EMAIL_CONVERSATION_INCLUDE = {
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
    select: { id: true, scheduledAt: true, subject: true, bodyText: true },
  },
};

@Injectable()
export class EmailInboxService {
  private readonly logger = new Logger(EmailInboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: EmailIntegrationsService,
    private readonly aiService: EmailAiService,
  ) {}

  /**
   * Auto-provision uncontacted leads and brokers who possess an email address
   */
  async autoProvisionExecutiveConversations(
    userId: string,
    roleCode: string,
    defaultProvider: string,
    defaultSenderEmail?: string | null,
    defaultSenderName?: string | null,
  ) {
    try {
      if (['PRE_SALES', 'SALES_EXECUTIVE'].includes(roleCode)) {
        const unprovisionedLeads = await this.prisma.lead.findMany({
          where: {
            assignedUserId: userId,
            deletedAt: null,
            email: { not: null },
            emailConversations: { none: {} },
          },
          take: 40,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });

        for (const lead of unprovisionedLeads) {
          if (!lead.email || !lead.email.trim()) continue;
          await this.prisma.emailConversation
            .create({
              data: {
                contactEmail: lead.email.trim(),
                contactName:
                  `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
                  'Lead',
                leadId: lead.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
                assignedSenderEmail: defaultSenderEmail || null,
                assignedSenderName: defaultSenderName || null,
              },
            })
            .catch(() => null);
        }
      } else if (roleCode === 'SOURCING_MANAGER') {
        const unprovisionedBrokers = await this.prisma.broker.findMany({
          where: {
            sourcingManagerId: userId,
            deletedAt: null,
            email: { not: null },
            emailConversations: { none: {} },
          },
          take: 40,
          select: { id: true, name: true, email: true },
        });

        for (const broker of unprovisionedBrokers) {
          if (!broker.email || !broker.email.trim()) continue;
          await this.prisma.emailConversation
            .create({
              data: {
                contactEmail: broker.email.trim(),
                contactName: broker.name || 'Broker',
                brokerId: broker.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
                assignedSenderEmail: defaultSenderEmail || null,
                assignedSenderName: defaultSenderName || null,
              },
            })
            .catch(() => null);
        }
      } else if (roleCode === 'POST_SALES') {
        const assignedBookings = await this.prisma.booking.findMany({
          where: {
            assignedPostSalesId: userId,
            customer: {
              emailConversations: { none: {} },
              email: { not: null },
            },
          },
          take: 40,
          select: {
            customer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        });

        for (const b of assignedBookings) {
          const customer = b.customer;
          if (!customer || !customer.email || !customer.email.trim()) continue;
          await this.prisma.emailConversation
            .create({
              data: {
                contactEmail: customer.email.trim(),
                contactName:
                  `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                  'Customer',
                customerId: customer.id,
                agentUserId: userId,
                status: 'open',
                isActive: true,
                assignedProvider: defaultProvider,
                assignedSenderEmail: defaultSenderEmail || null,
                assignedSenderName: defaultSenderName || null,
              },
            })
            .catch(() => null);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Auto-provisioning executive Email conversations skipped: ${err?.message}`,
      );
    }
  }

  /**
   * List paginated conversations with role scoping, search, and contact qualification.
   */
  async listConversations(
    query: ListEmailConversationsQueryDto,
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

    // Get default Email provider for assignedProvider continuity
    let defaultProviderName = 'SYSTEM_DEFAULT';
    let defaultSenderEmail: string | null = null;
    let defaultSenderName: string | null = null;
    const defaultIntegration = await this.prisma.marketingIntegration.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { provider: true, fromEmail: true, fromName: true },
    });
    if (defaultIntegration?.provider) {
      defaultProviderName = defaultIntegration.provider;
      defaultSenderEmail = defaultIntegration.fromEmail;
      defaultSenderName = defaultIntegration.fromName;
    }

    if (currentUser?.id && roleCode && !isMarketing) {
      await this.autoProvisionExecutiveConversations(
        currentUser.id,
        roleCode,
        defaultProviderName,
        defaultSenderEmail,
        defaultSenderName,
      );
    }

    const where: any = { isActive: true };

    if (query.status && ['open', 'pending', 'closed'].includes(query.status)) {
      where.status = query.status;
    }

    const andConditions: any[] = [];

    // Qualification invariant: Contact must have an email address
    andConditions.push({
      contactEmail: { not: '' },
    });

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      andConditions.push({
        OR: [
          { contactEmail: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
          { lastMessageText: { contains: q, mode: 'insensitive' } },
          {
            lead: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
          {
            broker: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
          {
            customer: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
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
      this.prisma.emailConversation.findMany({
        where,
        include: EMAIL_CONVERSATION_INCLUDE,
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.emailConversation.count({ where }),
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
   * Get single conversation by ID with lead and agent profile
   */
  async getConversation(id: string) {
    const conv = await this.prisma.emailConversation.findUnique({
      where: { id },
      include: EMAIL_CONVERSATION_INCLUDE,
    });

    if (!conv) {
      throw new NotFoundException(`Email conversation #${id} not found`);
    }

    return conv;
  }

  /**
   * Get chronological message thread for a conversation
   */
  async getMessages(conversationId: string, query?: ListEmailMessagesQueryDto) {
    const conv = await this.prisma.emailConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException(
        `Email conversation #${conversationId} not found`,
      );
    }

    const messages = await this.prisma.emailMessage.findMany({
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
   * Start a new conversation or return existing active one with a contact/lead
   */
  async startConversation(
    dto: StartEmailConversationDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const contactEmail = dto.contactEmail.trim().toLowerCase();

    // 1. If leadId provided, enrich details from CRM lead
    let lead: any = null;
    if (dto.leadId) {
      lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    }

    const contactName =
      dto.contactName ||
      (lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '') ||
      contactEmail.split('@')[0];

    // 2. Check for existing active conversation with this email
    const existing = await this.prisma.emailConversation.findFirst({
      where: {
        contactEmail: { equals: contactEmail, mode: 'insensitive' },
        isActive: true,
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
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
          },
        },
      },
    });

    if (existing) {
      // If initial message provided, dispatch it as a reply
      if (dto.initialMessage?.trim()) {
        await this.sendReply(
          existing.id,
          { text: dto.initialMessage.trim(), subject: dto.subject },
          senderUser,
        );
      }
      return existing;
    }

    // 3. Resolve default provider and sender identity if not specified
    let provider = dto.assignedProvider || 'SYSTEM_DEFAULT';
    let senderEmail = dto.assignedSenderEmail;

    if (!senderEmail) {
      const activeIntegration =
        await this.prisma.marketingIntegration.findFirst({
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
      if (activeIntegration) {
        provider = activeIntegration.provider;
        senderEmail = activeIntegration.fromEmail;
      } else {
        senderEmail = 'sales@brokeros.com';
      }
    }

    // 4. Create conversation record
    const created = await this.prisma.emailConversation.create({
      data: {
        contactEmail,
        contactName,
        subject: dto.subject,
        leadId: dto.leadId || lead?.id || null,
        agentUserId: senderUser?.id || null,
        assignedProvider: provider,
        assignedSenderEmail: senderEmail,
        assignedSenderName: senderUser?.name || 'Sales Team',
        status: 'open',
        unreadCount: 0,
        lastMessageText:
          dto.initialMessage?.slice(0, 150) || 'Conversation started',
        lastMessageAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, email: true } },
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
          },
        },
      },
    });

    // 5. If initial message provided, dispatch it immediately
    if (dto.initialMessage?.trim()) {
      await this.sendReply(
        created.id,
        { text: dto.initialMessage.trim(), subject: dto.subject },
        senderUser,
      );
    }

    return created;
  }

  /**
   * Send 2-way outbound reply with thread continuity.
   * Dispatches via the conversation's dedicated assignedProvider and assignedSenderEmail.
   */
  async sendReply(
    conversationId: string,
    dto: SendEmailReplyDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const conv = await this.prisma.emailConversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    });

    if (!conv) {
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    const textContent = dto.text?.trim() || '';
    const htmlContent =
      dto.html?.trim() ||
      (textContent
        ? textContent
            .split('\n')
            .map(
              (p) => `<p style="margin:0 0 12px 0;line-height:1.5;">${p}</p>`,
            )
            .join('')
        : '');

    if (!textContent && !htmlContent) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const replySubject =
      dto.subject ||
      (conv.subject?.startsWith('Re:')
        ? conv.subject
        : `Re: ${conv.subject || 'Inquiry'}`);
    const provider = conv.assignedProvider || 'SYSTEM_DEFAULT';
    const fromEmail = conv.assignedSenderEmail || 'sales@brokeros.com';
    const fromName =
      senderUser?.name || conv.assignedSenderName || 'Sales Team';

    // Find the latest inbound or outbound message in this thread for In-Reply-To header
    const lastMsg = await this.prisma.emailMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });

    const inReplyTo = lastMsg?.providerMsgId || undefined;

    // Load credentials for the dedicated assignedProvider
    let credentials: ProviderCredentials | undefined;
    if (provider !== 'SYSTEM_DEFAULT') {
      const integration = await this.prisma.marketingIntegration.findFirst({
        where: { provider: provider as any, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      if (integration) {
        credentials = {
          apiKey: integration.apiKey || undefined,
          awsAccessKeyId: integration.awsAccessKeyId || undefined,
          awsSecretKey: integration.awsSecretKey || undefined,
          awsRegion: integration.awsRegion || undefined,
          mailchimpServer: integration.mailchimpServer || undefined,
          fromEmail: integration.fromEmail,
          fromName: integration.fromName,
        };
      }
    }

    // Dispatch email via provider adapter
    let providerMsgId: string | null = null;
    try {
      const adapter = this.integrationsService.getAdapter(provider);
      const sendRes = await adapter.sendBatch(
        {
          fromEmail,
          fromName,
          replyTo: fromEmail,
          to: [
            {
              email: conv.contactEmail,
              name: conv.contactName || conv.contactEmail.split('@')[0],
              leadId: conv.leadId || undefined,
            },
          ],
          subject: replySubject,
          htmlContent,
          plainTextContent: textContent,
          attachments: dto.attachments?.map((att) => ({
            filename: att.name,
            content: att.url,
            contentType: att.contentType || 'application/octet-stream',
          })),
        },
        credentials,
      );

      providerMsgId = sendRes.providerMessageId || null;
      this.logger.log(
        `Inbox Outbound Email dispatched via ${provider}: to=${conv.contactEmail} msgId=${providerMsgId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to dispatch email via ${provider}: ${err.message}`,
      );
      // Record failed message or allow continuing in development
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(`Email delivery failed: ${err.message}`);
      }
    }

    // Record outbound EmailMessage in thread
    const createdMessage = await this.prisma.emailMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'agent',
        senderName: fromName,
        fromEmail,
        toEmail: conv.contactEmail,
        subject: replySubject,
        bodyText: textContent,
        bodyHtml: htmlContent,
        status: providerMsgId ? 'DELIVERED' : 'SENT',
        provider,
        providerMsgId,
        inReplyTo,
        attachments: (dto.attachments as any) || undefined,
        sentAt: new Date(),
      },
    });

    // Update conversation summary
    await this.prisma.emailConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: textContent.slice(0, 180),
        lastMessageAt: new Date(),
        status: 'open',
      },
    });

    return createdMessage;
  }

  /**
   * Update conversation status: open | pending | closed
   */
  async updateStatus(id: string, status: 'open' | 'pending' | 'closed') {
    const updated = await this.prisma.emailConversation.update({
      where: { id },
      data: { status },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            temperature: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Assign or unassign agent to conversation
   */
  async assignAgent(id: string, agentUserId: string | null) {
    const updated = await this.prisma.emailConversation.update({
      where: { id },
      data: { agentUserId },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            temperature: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Mark conversation as read (resets unreadCount to 0)
   */
  async markRead(id: string) {
    return this.prisma.emailConversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  /**
   * Generate an AI-assisted draft reply based on conversation history
   */
  async draftAiReply(conversationId: string, dto?: DraftEmailAiReplyDto) {
    const conv = await this.prisma.emailConversation.findUnique({
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
      throw new NotFoundException(`Conversation #${conversationId} not found`);
    }

    // Get recent messages in thread (chronological order)
    const recentMessages = await this.prisma.emailMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
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
      conv.assignedSenderName ||
      conv.lead?.assignedUser?.name ||
      'Property Advisory Consultant';

    const campaignTitle =
      conv.campaign?.title ||
      conv.lead?.interestedProject?.name ||
      'Exclusive Property Update';

    const projectInfo = conv.lead?.interestedProject
      ? {
          name: conv.lead.interestedProject.name,
          city: conv.lead.interestedProject.city || undefined,
          description: conv.lead.interestedProject.description || undefined,
        }
      : null;

    const latestSubject =
      chronological[chronological.length - 1]?.subject ||
      conv.subject ||
      `Inquiry regarding ${campaignTitle}`;

    const aiRes = await this.aiService.generateAutoreply({
      leadName,
      advisorName,
      originalSubject: latestSubject,
      originalCampaignTitle: campaignTitle,
      project: projectInfo,
      messages: chronological.map((m) => ({
        direction: m.direction,
        senderName: m.senderName || undefined,
        subject: m.subject || undefined,
        bodyText: m.bodyText || '',
      })),
      customInstructions: dto?.instruction,
    });

    return {
      subject: aiRes.subject,
      textBody: aiRes.textBody,
      htmlBody: aiRes.htmlBody,
    };
  }

  /**
   * Schedule an Email reply for future delivery
   */
  async scheduleMessage(
    conversationId: string,
    dto: ScheduleEmailDto,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const conv = await this.prisma.emailConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException(`Email Conversation #${conversationId} not found`);
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
      throw new BadRequestException('Scheduled time must be at least 10 seconds in the future');
    }

    const textContent = dto.text?.trim() || '';
    const htmlContent =
      dto.html?.trim() ||
      (textContent
        ? textContent
            .split('\n')
            .map((p) => `<p style="margin:0 0 12px 0;line-height:1.5;">${p}</p>`)
            .join('')
        : '');

    if (!textContent && !htmlContent) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const replySubject =
      dto.subject ||
      (conv.subject?.startsWith('Re:')
        ? conv.subject
        : `Re: ${conv.subject || 'Inquiry'}`);

    const provider = conv.assignedProvider || 'SYSTEM_DEFAULT';
    const fromEmail = conv.assignedSenderEmail || 'sales@brokeros.com';
    const fromName = senderUser?.name || conv.assignedSenderName || 'Sales Team';

    const scheduledMessage = await this.prisma.emailMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'agent',
        senderName: fromName,
        fromEmail,
        toEmail: conv.contactEmail,
        subject: replySubject,
        bodyText: textContent,
        bodyHtml: htmlContent,
        status: 'SCHEDULED',
        provider,
        attachments: (dto.attachments as any) || undefined,
        scheduledAt: scheduledDate,
        scheduledBy: senderUser?.id || null,
        isScheduled: true,
      },
    });

    return scheduledMessage;
  }

  /**
   * Get all pending scheduled Email messages for a conversation
   */
  async getScheduledMessages(conversationId: string) {
    return this.prisma.emailMessage.findMany({
      where: {
        conversationId,
        status: 'SCHEDULED',
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Reschedule an existing scheduled Email message
   */
  async rescheduleMessage(messageId: string, newScheduledAt: string) {
    const msg = await this.prisma.emailMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled Email message #${messageId} not found`);
    }

    const scheduledDate = new Date(newScheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    return this.prisma.emailMessage.update({
      where: { id: messageId },
      data: { scheduledAt: scheduledDate },
    });
  }

  /**
   * Edit content and/or date of a scheduled Email message
   */
  async editScheduledMessage(messageId: string, dto: EditScheduledEmailDto) {
    const msg = await this.prisma.emailMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled Email message #${messageId} not found`);
    }

    const data: any = {};
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.text !== undefined) data.bodyText = dto.text;
    if (dto.html !== undefined) data.bodyHtml = dto.html;
    if (dto.attachments !== undefined) data.attachments = dto.attachments as any;

    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + 5000) {
        throw new BadRequestException('Scheduled time must be in the future');
      }
      data.scheduledAt = scheduledDate;
    }

    return this.prisma.emailMessage.update({
      where: { id: messageId },
      data,
    });
  }

  /**
   * Cancel a scheduled Email message
   */
  async cancelScheduledMessage(messageId: string) {
    const msg = await this.prisma.emailMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.status !== 'SCHEDULED') {
      throw new NotFoundException(`Scheduled Email message #${messageId} not found`);
    }

    return this.prisma.emailMessage.update({
      where: { id: messageId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Immediately dispatch a scheduled Email message
   */
  async sendScheduledMessageNow(
    messageId: string,
    senderUser?: { id: string; name?: string; email?: string },
  ) {
    const res = await dispatchScheduledMessage(this.prisma, {
      channel: 'EMAIL',
      messageId,
      triggeredBy: senderUser?.id,
    });

    if (!res.success) {
      if (res.alreadyProcessed) {
        throw new BadRequestException('Email is already processing or sent');
      }
      throw new BadRequestException(res.error || 'Failed to dispatch scheduled Email');
    }

    return this.prisma.emailMessage.findUnique({
      where: { id: messageId },
    });
  }
}

