// ============================================================================
// BrokerOS — WhatsApp AI Assistant Service (Configuration & Draft Generation)
// ============================================================================

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prismaClient } from '@brokeros/prisma';
import {
  encrypt,
  decrypt,
  sendTextMessage,
  phoneVariants,
} from '@brokeros/int-whatsapp';
import { WhatsAppConfigService } from '../config/whatsapp-config.service.js';
import { WhatsAppRealtimeGateway } from '../gateway/whatsapp-realtime.gateway.js';
import type { SaveWhatsAppAiConfigDto } from '../dto/whatsapp.dto.js';
import { callLlmChatCompletion } from './engine/llm-provider.helper.js';

@Injectable()
export class WhatsAppAiService {
  private readonly logger = new Logger(WhatsAppAiService.name);
  private readonly prisma = prismaClient;

  constructor(
    private readonly configService: WhatsAppConfigService,
    private readonly realtimeGateway: WhatsAppRealtimeGateway,
  ) {}

  /**
   * Get AI assistant configuration for an account.
   * NEVER returns decrypted API key to callers.
   */
  async getAiConfig(accountId?: string) {
    let targetAccountId =
      accountId && accountId !== 'undefined' ? accountId : null;
    if (!targetAccountId) {
      const defaultAccount =
        await this.prisma.whatsAppBusinessAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });
      if (defaultAccount) targetAccountId = defaultAccount.id;
    }

    if (!targetAccountId) {
      return null;
    }

    const config = await this.prisma.whatsAppAiConfig.findUnique({
      where: { accountId: targetAccountId },
    });

    if (!config) {
      return null;
    }

    return {
      ...config,
      apiKey: config.apiKey ? '••••••••' : null,
    };
  }

  /**
   * Save or update AI assistant configuration.
   * Encrypts the provided API key using AES-256-GCM.
   */
  async saveAiConfig(
    accountId: string | undefined,
    dto: SaveWhatsAppAiConfigDto,
  ) {
    let targetAccountId =
      accountId && accountId !== 'undefined' ? accountId : null;
    if (!targetAccountId) {
      const defaultAccount =
        await this.prisma.whatsAppBusinessAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });
      if (defaultAccount) targetAccountId = defaultAccount.id;
    }

    if (!targetAccountId) {
      throw new BadRequestException(
        'No active WhatsApp business account found. Please connect a WhatsApp account first.',
      );
    }

    const existing = await this.prisma.whatsAppAiConfig.findUnique({
      where: { accountId: targetAccountId },
    });

    let encryptedKey = existing?.apiKey || '';
    if (dto.apiKey === '' || dto.apiKey === null) {
      // Explicitly allow clearing BYO key to fall back to environment variables
      encryptedKey = '';
    } else if (dto.apiKey && dto.apiKey !== '••••••••') {
      encryptedKey = encrypt(dto.apiKey.trim());
    }

    const providerLower = dto.provider.toLowerCase();
    const modelToSave =
      !dto.model || dto.model.includes('llama') || dto.model.includes('mixtral')
        ? providerLower === 'groq'
          ? 'openai/gpt-oss-120b'
          : dto.model || 'gpt-4o-mini'
        : dto.model;

    const saved = await this.prisma.whatsAppAiConfig.upsert({
      where: { accountId: targetAccountId },
      create: {
        accountId: targetAccountId,
        provider: providerLower,
        model: modelToSave,
        apiKey: encryptedKey,
        systemPrompt: dto.systemPrompt || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        autoReplyEnabled:
          dto.autoReplyEnabled !== undefined ? dto.autoReplyEnabled : false,
        autoReplyMaxPerConversation: dto.autoReplyMaxPerConversation || 3,
        handoffAgentId: dto.handoffAgentId || null,
      },
      update: {
        provider: providerLower,
        model: modelToSave,
        apiKey: encryptedKey,
        systemPrompt:
          dto.systemPrompt !== undefined ? dto.systemPrompt : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        autoReplyEnabled:
          dto.autoReplyEnabled !== undefined ? dto.autoReplyEnabled : undefined,
        autoReplyMaxPerConversation:
          dto.autoReplyMaxPerConversation !== undefined
            ? dto.autoReplyMaxPerConversation
            : undefined,
        handoffAgentId:
          dto.handoffAgentId !== undefined ? dto.handoffAgentId : undefined,
      },
    });

    return {
      ...saved,
      apiKey: saved.apiKey ? '••••••••' : null,
    };
  }

  /**
   * Delete AI assistant configuration for an account.
   */
  async deleteAiConfig(accountId: string) {
    await this.prisma.whatsAppAiConfig.deleteMany({
      where: { accountId },
    });
    return { success: true, message: 'AI configuration deleted' };
  }

  /**
   * Generate a draft AI suggested reply based on recent conversation history.
   * Does NOT auto-send — returns the draft string for the human agent to review and edit.
   */
  async draftReply(
    accountId: string | undefined,
    conversationId: string,
    agentName?: string,
    instruction?: string,
  ): Promise<{ draft: string }> {
    const conversation = await this.prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        agent: true,
        lead: {
          include: {
            interestedProject: true,
            assignedUser: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    let targetAccountId =
      accountId && accountId !== 'undefined'
        ? accountId
        : conversation.accountId;
    if (!targetAccountId) {
      const defaultAccount =
        await this.prisma.whatsAppBusinessAccount.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        });
      if (defaultAccount) targetAccountId = defaultAccount.id;
    }

    // 1. Resolve AI credentials: check BYO config or fallback to system Groq/OpenAI keys
    const config = targetAccountId
      ? await this.prisma.whatsAppAiConfig.findUnique({
          where: { accountId: targetAccountId },
        })
      : null;

    let provider = config?.provider || 'groq';
    let model = config?.model || 'openai/gpt-oss-120b';
    if (!model || model.includes('llama') || model.includes('mixtral')) {
      model = provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
    }
    let apiKey = '';

    if (config?.apiKey) {
      try {
        apiKey = decrypt(config.apiKey);
      } catch (err: any) {
        this.logger.warn(`Failed to decrypt BYO AI key: ${err?.message}`);
      }
    }

    // Verify key format: Groq keys start with 'gsk_', OpenAI keys start with 'sk-'
    const isGroqKeyValid = provider === 'groq' && apiKey.startsWith('gsk_');
    const isOpenAiKeyValid =
      provider === 'openai' &&
      (apiKey.startsWith('sk-') || apiKey.length >= 20);

    if (
      !apiKey ||
      (provider === 'groq' && !isGroqKeyValid) ||
      (provider === 'openai' && !isOpenAiKeyValid)
    ) {
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
        apiKey = process.env.GROQ_API_KEY;
        if (!model || model.includes('llama') || model.includes('mixtral')) {
          model = 'openai/gpt-oss-120b';
        }
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai';
        apiKey = process.env.OPENAI_API_KEY;
        model = 'gpt-4o-mini';
      }
    }

    if (!apiKey) {
      throw new BadRequestException(
        'No AI API key configured. Please configure an AI provider in WhatsApp Settings or set GROQ_API_KEY in .env.',
      );
    }

    // 2. Resolve contextual entities with enriched real-estate specifications
    const lead = conversation.lead;
    const project = lead?.interestedProject;

    const leadName =
      conversation.contact?.name ||
      conversation.contactName ||
      (lead
        ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
        : '') ||
      'Valued Client';

    const advisorName =
      agentName ||
      conversation.agent?.name ||
      lead?.assignedUser?.name ||
      'Property Advisory Consultant';

    const projectName = project?.name || 'Prime Luxury Residences';
    const projectCity = project?.city || 'the prime city center';
    const projectLocation = project?.address || projectCity;
    const projectAmenities =
      project?.amenities && project.amenities.length > 0
        ? project.amenities.slice(0, 5).join(', ')
        : 'Clubhouse, Swimming Pool, Fitness Center, 24/7 Security';
    const brochureUrl = project?.brochureUrl || '';
    const knownBhk = lead?.preferredConfig || '';
    const knownBudget = lead?.budget
      ? `₹${Number(lead.budget).toLocaleString('en-IN')}`
      : '';

    // 3. Fetch recent conversation messages (last 20)
    const recentMessages = await this.prisma.whatsAppMessage.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });

    // Re-order chronologically (oldest first)
    const chronological = [...recentMessages].reverse();

    const formattedMessages =
      chronological.length === 0
        ? [
            {
              role: 'user' as const,
              content: `Please draft an initial, warm, and highly engaging WhatsApp outreach message to prospective buyer ${leadName} introducing myself as ${advisorName} from BrokerOS regarding *${projectName}* in ${projectLocation}. Conclude with a natural alternative-choice question asking whether they are exploring a 2 BHK or 3 BHK layout.`,
            },
          ]
        : chronological.map((m) => ({
            role:
              m.direction === 'INBOUND'
                ? ('user' as const)
                : ('assistant' as const),
            content: m.body || `[${m.contentType || 'Media'}]`,
          }));

    // 4. Build comprehensive, high-converting real-estate sales prompt
    const defaultSystemPrompt = `You are ${advisorName}, a senior real estate advisor with BrokerOS Realty representing *${projectName}* in ${projectLocation}.
Client / Lead Name: ${leadName}

PROPERTY KNOWLEDGE BASE:
- Project: ${projectName} (${projectCity})
- Key Highlights & Amenities: ${projectAmenities}
${brochureUrl ? `- Digital Brochure Link: ${brochureUrl}` : ''}
${knownBhk ? `- Known Client Preference: ${knownBhk}` : ''}
${knownBudget ? `- Known Client Budget: ${knownBudget}` : ''}

PRIMARY OBJECTIVE:
Your goal is to build immediate rapport, answer questions concisely, qualify their requirements (BHK, budget, purchase timeline), and guide them toward scheduling an on-site sample flat walkthrough. Real estate deals are closed on-site, never over text.

TACTICAL CONVERSATIONAL RULES:
1. ALWAYS END WITH A LOW-FRICTION QUESTION:
   - Never send a dead-end message. Always conclude with a single, easy-to-answer question or an alternative-choice prompt.
   - Site visit ask: "Would Saturday morning or Sunday afternoon work better for a brief walkthrough of the sample apartment?"
   - Qualification ask: "Are you primarily exploring a 2 BHK or 3 BHK configuration?"

2. PRICING & NEGOTIATIONS:
   - State starting price ranges if known, followed by a value hook.
   - For discounts or price negotiations: Never say "no" or make up random numbers. Say: "We have exclusive spot-booking benefits and customized payment milestone plans that our sales director can extend during your site visit."

3. BROCHURE & FLOOR PLANS:
   - When asked for brochures or floor plans, share relevant details and ask a qualifying follow-up: "Here are the layout specifications. Which floor height do you prefer—peaceful lower floors or panoramic higher levels?"

4. FORMATTING FOR WHATSAPP:
   - Length: Strictly 1 to 3 short sentences. No walls of text.
   - Use WhatsApp *bold* sparingly on project names and key numbers.
   - NO markdown headings (# or ##). NO bullet point spam.
   - Use natural emojis sparingly (e.g. 🏢, 📍, ✨) to sound human and approachable.

5. ABSOLUTELY ZERO PLACEHOLDERS (CRITICAL):
   - NEVER output bracketed or bold placeholders like [Your Name], **Your Name**, [Agent Name], [Company Name], [Phone Number], or [Insert Link].
   - If including a sign-off, sign naturally as "${advisorName}". On fast in-thread replies, omit signature completely.

6. TONE & VARIETY:
   - Executive, warm, polite, consultative, and natural.
   - Generate fresh, engaging phrasing every time.
${instruction ? `\nUser Custom Instruction: ${instruction}` : ''}`;

    const systemPrompt = config?.systemPrompt
      ? `${config.systemPrompt}\n\nAdvisor Name: ${advisorName}\nProject: ${projectName} (${projectLocation})\nClient Name: ${leadName}\nCRITICAL: Never output placeholders like [Your Name]. Always end with a low-friction question or site visit CTA.`
      : defaultSystemPrompt;

    // 5. Dispatch to LLM provider with slight temperature for variety
    const draft = await callLlmChatCompletion({
      provider,
      model,
      apiKey,
      systemPrompt,
      messages: formattedMessages,
      logger: this.logger,
      temperature: 0.82,
    });

    return { draft };
  }

  /**
   * Automatically reply to an inbound customer message using AI (wacrm auto-reply law).
   * Non-blocking, never throws to webhook caller.
   */
  async dispatchInboundToAiReply(
    accountId: string,
    conversationId: string,
    contactId: string,
  ): Promise<void> {
    try {
      const config = await this.prisma.whatsAppAiConfig.findUnique({
        where: { accountId },
      });
      if (!config || !config.isActive || !config.autoReplyEnabled) return;

      // 1. Check if active message-level automations exist (keyword/message)
      const activeAutomationsCount = await this.prisma.whatsAppAutomation.count(
        {
          where: {
            accountId,
            isActive: true,
            triggerType: { in: ['new_message_received', 'keyword_match'] },
          },
        },
      );
      if (activeAutomationsCount > 0) return; // Automations take precedence to avoid double texting

      // 2. Check conversation eligibility
      const conversation = await this.prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });
      if (!conversation || !conversation.isActive) return;
      if (conversation.agentUserId) return; // Human agent owns thread
      if (conversation.aiAutoReplyDisabled) return; // Thread opted out
      const maxReplies = config.autoReplyMaxPerConversation || 3;
      if (conversation.aiReplyCount >= maxReplies) return; // Cap reached

      // 3. Generate reply text
      const { draft } = await this.draftReply(accountId, conversationId);
      if (!draft) return;

      // 4. Send via Meta API
      const account = await this.configService.getDecryptedAccount(accountId);
      if (!account) return;

      const targetPhone =
        conversation.contactPhone || conversation.contact?.phone;
      if (!targetPhone) return;

      const variants = phoneVariants(targetPhone);
      let sentId: string | null = null;
      for (const variant of variants) {
        try {
          const res = await sendTextMessage({
            phoneNumberId: account.phoneNumberId,
            accessToken: account.accessToken,
            to: variant,
            text: draft,
          });
          if (res?.messageId) {
            sentId = res.messageId;
            break;
          }
        } catch {
          // try next variant
        }
      }

      if (!sentId) return;

      // 5. Persist outbound message row
      const messageRow = await this.prisma.whatsAppMessage.create({
        data: {
          conversationId,
          waMessageId: sentId,
          direction: 'OUTBOUND',
          type: 'TEXT',
          status: 'SENT',
          senderType: 'bot',
          contentType: 'text',
          senderName: 'AI Assistant',
          body: draft,
          sentAt: new Date(),
        },
      });

      // 6. Increment reply count and update preview
      const updatedConv = await this.prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageText: draft,
          lastMessageAt: messageRow.sentAt,
          aiReplyCount: { increment: 1 },
        },
        include: {
          contact: true,
          agent: { select: { id: true, name: true, email: true } },
        },
      });

      // 7. Emit real-time updates to live inbox
      this.realtimeGateway.emitMessageSent(
        conversationId,
        messageRow,
        accountId,
      );
      this.realtimeGateway.emitConversationUpdated(accountId, updatedConv);
      this.logger.log(
        `AI auto-reply delivered for conversation ${conversationId}`,
      );
    } catch (err: any) {
      this.logger.error(`AI auto-reply error: ${err?.message}`);
    }
  }
}
