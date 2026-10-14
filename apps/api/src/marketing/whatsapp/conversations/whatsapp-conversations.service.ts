// ============================================================================
// BrokerOS — WhatsApp Conversations Service
// ============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prismaClient } from '@brokeros/prisma';
import { sanitizePhoneForMeta } from '@brokeros/int-whatsapp';
import { WhatsAppRealtimeGateway } from '../gateway/whatsapp-realtime.gateway.js';
import type {
  ListWhatsAppConversationsQueryDto,
  StartWhatsAppConversationDto,
} from '../dto/whatsapp.dto.js';

@Injectable()
export class WhatsAppConversationsService {
  private readonly logger = new Logger(WhatsAppConversationsService.name);
  private readonly prisma = prismaClient;

  constructor(private readonly realtimeGateway: WhatsAppRealtimeGateway) {}

  /**
   * List paginated conversations with filtering, search, and strict departmental/role scoping.
   * Auto-provisions conversations for any active contacts or newly assigned leads that lack one.
   */
  async listConversations(
    query: ListWhatsAppConversationsQueryDto,
    scopedAccountId?: string,
    currentUser?: { id: string; roleId?: string; role?: any; name?: string },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    let accountId = scopedAccountId || query.accountId;
    if (!accountId) {
      const defaultAccount = await this.prisma.whatsAppBusinessAccount.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (defaultAccount) {
        accountId = defaultAccount.id;
      }
    }

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

    // Auto-provision conversations for assigned leads/brokers if user is an operational executive
    if (currentUser?.id && roleCode && accountId && !isMarketing) {
      await this.autoProvisionExecutiveConversations(
        currentUser.id,
        roleCode,
        accountId,
      );
    }

    // Auto-provision conversation records for any active contacts that don't have one yet
    try {
      const contactsWithoutConv = await this.prisma.whatsAppContact.findMany({
        where: {
          deletedAt: null,
          conversations: { none: {} },
          ...(accountId ? { accountId } : {}),
        },
        take: 50,
      });

      if (contactsWithoutConv.length > 0) {
        for (const c of contactsWithoutConv) {
          await this.prisma.whatsAppConversation
            .create({
              data: {
                accountId: c.accountId,
                contactId: c.id,
                contactPhone: c.phone,
                contactName: c.name,
                leadId: c.leadId,
                status: 'open',
                isActive: true,
              },
            })
            .catch(() => null);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Auto-provisioning contacts skipped: ${err?.message}`,
      );
    }

    const where: Record<string, any> = {
      isActive: true,
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (query.status && ['open', 'pending', 'closed'].includes(query.status)) {
      where.status = query.status;
    }

    const andConditions: any[] = [];

    if (query.search) {
      const term = query.search.trim();
      andConditions.push({
        OR: [
          { contactPhone: { contains: term, mode: 'insensitive' } },
          { contactName: { contains: term, mode: 'insensitive' } },
          { lastMessageText: { contains: term, mode: 'insensitive' } },
          {
            contact: {
              name: { contains: term, mode: 'insensitive' },
            },
          },
          {
            lead: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
          {
            broker: {
              name: { contains: term, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    // ── Explicit entity scoping (leadId, brokerId, customerId) ───────────────
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
        where.broker = { sourcingManagerId: currentUser?.id };
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
      // Manager Team Oversight
      const targetAgentId = query.assignedUserId || query.agentId;
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
        const subIds = [currentUser.id, ...subordinates.map((s) => s.id)];

        if (
          roleCode === 'PRE_SALES_MANAGER' ||
          effectiveDept === 'PRE_SALES'
        ) {
          where.lead = { assignedUserId: { in: subIds }, deletedAt: null };
        } else if (
          roleCode === 'SALES_MANAGER' ||
          effectiveDept === 'SALES'
        ) {
          where.lead = { assignedUserId: { in: subIds }, deletedAt: null };
        } else if (
          roleCode === 'POST_SALES_MANAGER' ||
          effectiveDept === 'POST_SALES'
        ) {
          where.customer = {
            bookings: { some: { assignedPostSalesId: { in: subIds } } },
          };
        }
      }
    } else if (effectiveDept) {
      // Department filtering for Admin, Business Manager, Director, Finance
      if (effectiveDept === 'PRE_SALES') {
        where.lead = {
          status: { in: ['NEW', 'CONTACTED', 'INTERESTED'] },
          deletedAt: null,
        };
      } else if (
        effectiveDept === 'SALES' ||
        effectiveDept === 'SALES_EXECUTIVE'
      ) {
        where.lead = {
          status: {
            in: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'BOOKING'],
          },
          deletedAt: null,
        };
      } else if (effectiveDept === 'POST_SALES') {
        where.customer = { bookings: { some: { status: 'CONFIRMED' } } };
      } else if (
        effectiveDept === 'SOURCING_MANAGER' ||
        effectiveDept === 'BROKERS'
      ) {
        where.brokerId = { not: null };
      } else if (effectiveDept === 'FINANCE') {
        andConditions.push({
          OR: [
            { customerId: { not: null } },
            { brokerId: { not: null } },
            {
              lead: {
                status: {
                  in: [
                    'BOOKING',
                    'DOCUMENT',
                    'LOAN',
                    'AGREEMENT',
                    'HANDOVER',
                  ],
                },
              },
            },
          ],
        });
      }
    }

    if (query.agentId && !where.agentUserId) {
      where.agentUserId = query.agentId;
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      this.prisma.whatsAppConversation.findMany({
        where,
        include: {
          contact: {
            include: {
              tags: {
                include: { tag: true },
              },
            },
          },
          agent: {
            select: { id: true, name: true, email: true },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
              temperature: true,
              score: true,
              assignedUserId: true,
              interestedProject: {
                select: { id: true, name: true },
              },
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          broker: {
            select: {
              id: true,
              name: true,
              phone: true,
              companyName: true,
              reraNumber: true,
            },
          },
          messages: {
            where: { status: 'SCHEDULED' },
            orderBy: { scheduledAt: 'asc' as const },
            take: 1,
            select: { id: true, scheduledAt: true, body: true },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.whatsAppConversation.count({ where }),
    ]);

    const mappedItems = items.map((item: any) => ({
      ...item,
      nextScheduledAt: item.messages?.[0]?.scheduledAt || null,
      scheduledCount: item.messages?.length || 0,
    }));

    return {
      items: mappedItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Helper: Auto-provisions WhatsAppConversation and Contact records for an
   * operational executive's assigned leads or brokers if not already existing.
   */
  private async autoProvisionExecutiveConversations(
    userId: string,
    roleCode: string,
    accountId: string,
  ) {
    try {
      if (
        ['PRE_SALES', 'SALES_EXECUTIVE', 'CLOSING_MANAGER'].includes(roleCode)
      ) {
        const unprovisionedLeads = await this.prisma.lead.findMany({
          where: {
            assignedUserId: userId,
            deletedAt: null,
            whatsappConversations: { none: {} },
          },
          take: 40,
          select: { id: true, firstName: true, lastName: true, phone: true },
        });

        for (const lead of unprovisionedLeads) {
          const cleanPhone = sanitizePhoneForMeta(lead.phone);
          if (!cleanPhone) continue;

          let contact = await this.prisma.whatsAppContact.findUnique({
            where: { accountId_phone: { accountId, phone: cleanPhone } },
          });

          if (!contact) {
            contact = (await this.prisma.whatsAppContact
              .create({
                data: {
                  accountId,
                  phone: cleanPhone,
                  name:
                    `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
                    null,
                  leadId: lead.id,
                },
              })
              .catch(() => null)) as any;
          }

          if (contact) {
            await this.prisma.whatsAppConversation
              .create({
                data: {
                  accountId,
                  contactId: contact.id,
                  contactPhone: cleanPhone,
                  contactName: contact.name,
                  leadId: lead.id,
                  agentUserId: userId,
                  status: 'open',
                  isActive: true,
                },
              })
              .catch(() => null);
          }
        }
      } else if (roleCode === 'SOURCING_MANAGER') {
        const unprovisionedBrokers = await this.prisma.broker.findMany({
          where: {
            sourcingManagerId: userId,
            deletedAt: null,
            whatsappConversations: { none: {} },
          },
          take: 40,
          select: { id: true, name: true, phone: true },
        });

        for (const broker of unprovisionedBrokers) {
          const cleanPhone = sanitizePhoneForMeta(broker.phone);
          if (!cleanPhone) continue;

          let contact = await this.prisma.whatsAppContact.findUnique({
            where: { accountId_phone: { accountId, phone: cleanPhone } },
          });

          if (!contact) {
            contact = (await this.prisma.whatsAppContact
              .create({
                data: {
                  accountId,
                  phone: cleanPhone,
                  name: broker.name,
                },
              })
              .catch(() => null)) as any;
          }

          if (contact) {
            await this.prisma.whatsAppConversation
              .create({
                data: {
                  accountId,
                  contactId: contact.id,
                  contactPhone: cleanPhone,
                  contactName: contact.name,
                  brokerId: broker.id,
                  agentUserId: userId,
                  status: 'open',
                  isActive: true,
                },
              })
              .catch(() => null);
          }
        }
      } else if (roleCode === 'POST_SALES') {
        const assignedBookings = await this.prisma.booking.findMany({
          where: {
            assignedPostSalesId: userId,
            customer: {
              whatsappConversations: { none: {} },
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
          if (!customer || !customer.phone) continue;
          const cleanPhone = sanitizePhoneForMeta(customer.phone);
          if (!cleanPhone) continue;

          let contact = await this.prisma.whatsAppContact.findUnique({
            where: { accountId_phone: { accountId, phone: cleanPhone } },
          });

          const customerFullName =
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
            'Customer';

          if (!contact) {
            contact = (await this.prisma.whatsAppContact
              .create({
                data: {
                  accountId,
                  phone: cleanPhone,
                  name: customerFullName,
                },
              })
              .catch(() => null)) as any;
          }

          if (contact) {
            await this.prisma.whatsAppConversation
              .create({
                data: {
                  accountId,
                  contactId: contact.id,
                  contactPhone: cleanPhone,
                  contactName: contact.name,
                  customerId: customer.id,
                  agentUserId: userId,
                  status: 'open',
                  isActive: true,
                },
              })
              .catch(() => null);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Auto-provisioning executive conversations skipped: ${err?.message}`,
      );
    }
  }

  /**
   * Start or get active conversation with contact or phone number.
   */
  async startOrCreateConversation(dto: StartWhatsAppConversationDto) {
    if (!dto.contactId && !dto.phone && !dto.leadId) {
      throw new BadRequestException(
        'Either contactId, phone, or leadId is required',
      );
    }

    let accountId = dto.accountId;
    if (!accountId) {
      const defaultAccount =
        await this.prisma.whatsAppBusinessAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });
      if (defaultAccount) {
        accountId = defaultAccount.id;
      }
    }

    if (!accountId) {
      throw new BadRequestException(
        'Active WhatsApp business account not found',
      );
    }

    let contact: any = null;

    if (dto.contactId) {
      contact = await this.prisma.whatsAppContact.findUnique({
        where: { id: dto.contactId },
      });
    }

    if (!contact && dto.phone) {
      const cleanPhone = sanitizePhoneForMeta(dto.phone);
      if (cleanPhone) {
        contact = await this.prisma.whatsAppContact.findUnique({
          where: { accountId_phone: { accountId, phone: cleanPhone } },
        });

        if (!contact) {
          const lead = await this.prisma.lead.findFirst({
            where: {
              OR: [{ phone: cleanPhone }, { phone: `+${cleanPhone}` }],
              deletedAt: null,
            },
            select: { id: true, firstName: true, lastName: true },
          });

          contact = await this.prisma.whatsAppContact.create({
            data: {
              accountId,
              phone: cleanPhone,
              name:
                dto.name ||
                (lead
                  ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                  : null),
              leadId: dto.leadId || lead?.id || null,
            },
          });
        }
      }
    }

    if (!contact && dto.leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.leadId },
      });
      if (lead?.phone) {
        const cleanPhone = sanitizePhoneForMeta(lead.phone);
        if (cleanPhone) {
          contact = await this.prisma.whatsAppContact.findUnique({
            where: { accountId_phone: { accountId, phone: cleanPhone } },
          });
          if (!contact) {
            contact = await this.prisma.whatsAppContact.create({
              data: {
                accountId,
                phone: cleanPhone,
                name:
                  `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
                  null,
                leadId: lead.id,
              },
            });
          }
        }
      }
    }

    if (!contact) {
      throw new NotFoundException(
        'Could not resolve contact to start conversation',
      );
    }

    let conversation = await this.prisma.whatsAppConversation.findFirst({
      where: {
        accountId,
        contactId: contact.id,
        isActive: true,
      },
      include: {
        contact: {
          include: {
            tags: { include: { tag: true } },
          },
        },
        agent: {
          select: { id: true, name: true, email: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.whatsAppConversation.create({
        data: {
          accountId,
          contactId: contact.id,
          contactPhone: contact.phone,
          contactName: contact.name,
          leadId: contact.leadId,
          status: 'open',
          isActive: true,
        },
        include: {
          contact: {
            include: {
              tags: { include: { tag: true } },
            },
          },
          agent: {
            select: { id: true, name: true, email: true },
          },
          lead: {
            select: { id: true, firstName: true, lastName: true, status: true },
          },
        },
      });
    }

    this.realtimeGateway.emitConversationUpdated(
      conversation.accountId,
      conversation,
    );
    return conversation;
  }

  /**
   * Get single conversation thread metadata.
   */
  async getConversation(id: string, accountId?: string) {
    const where: Record<string, any> = { id };
    if (accountId) where.accountId = accountId;

    const conversation = await this.prisma.whatsAppConversation.findFirst({
      where,
      include: {
        contact: {
          include: {
            tags: {
              include: { tag: true },
            },
          },
        },
        agent: {
          select: { id: true, name: true, email: true },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            temperature: true,
            score: true,
            assignedUserId: true,
            interestedProject: {
              select: { id: true, name: true },
            },
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            phone: true,
            companyName: true,
            reraNumber: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return conversation;
  }

  /**
   * Update conversation status (open, pending, closed).
   */
  async updateStatus(
    id: string,
    status: 'open' | 'pending' | 'closed',
    accountId?: string,
  ) {
    const conv = await this.getConversation(id, accountId);

    const updated = await this.prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { status },
      include: {
        contact: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    this.realtimeGateway.emitConversationUpdated(updated.accountId, updated);
    return updated;
  }

  /**
   * Assign or unassign agent to conversation.
   */
  async assignAgent(
    id: string,
    agentUserId: string | null,
    accountId?: string,
  ) {
    const conv = await this.getConversation(id, accountId);

    const updated = await this.prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { agentUserId: agentUserId || null },
      include: {
        contact: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    this.realtimeGateway.emitConversationUpdated(updated.accountId, updated);
    return updated;
  }

  /**
   * Mark all unread messages in conversation as read.
   */
  async markRead(id: string, accountId?: string) {
    const conv = await this.getConversation(id, accountId);

    const updated = await this.prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { unreadCount: 0 },
      include: {
        contact: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    this.realtimeGateway.emitConversationUpdated(updated.accountId, updated);
    return updated;
  }
}
