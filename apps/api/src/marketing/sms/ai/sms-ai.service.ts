// ============================================================================
// BrokerOS — SMS AI Assistant & Autoreply Service (Groq openai/gpt-oss-120b)
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { encrypt, decrypt } from '@brokeros/int-whatsapp';
import type { SaveSmsAiConfigDto } from '../dto/sms-flows.dto.js';

export interface SmsAiGenerateReplyArgs {
  leadName?: string;
  advisorName?: string;
  inboundBody?: string;
  originalCampaignTitle?: string;
  project?: {
    name?: string;
    city?: string;
    address?: string;
    description?: string;
    amenities?: string[];
    brochureUrl?: string;
  } | null;
  messages?: Array<{ direction: string; text: string; senderName?: string }>;
  customInstructions?: string;
}

@Injectable()
export class SmsAiService {
  private readonly logger = new Logger(SmsAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active SMS AI configuration. Masked API key.
   */
  async getAiConfig() {
    const config = await this.prisma.smsAiConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: null,
        systemPrompt: this.getDefaultSystemPrompt(),
        isActive: true,
        autoReplyEnabled: false,
        autoReplyMaxPerLead: 3,
        maxCharacters: 160,
      };
    }

    return {
      ...config,
      apiKey: config.apiKey ? '••••••••' : null,
    };
  }

  /**
   * Save or update SMS AI configuration.
   */
  async saveAiConfig(dto: SaveSmsAiConfigDto) {
    const existing = await this.prisma.smsAiConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let encryptedKey = existing?.apiKey || '';
    if (dto.apiKey === '' || dto.apiKey === null) {
      encryptedKey = '';
    } else if (dto.apiKey && dto.apiKey !== '••••••••') {
      encryptedKey = encrypt(dto.apiKey.trim());
    }

    const selectedModel =
      dto.model && dto.model.trim().length > 0
        ? dto.model.trim()
        : dto.provider === 'openai'
          ? 'gpt-4o-mini'
          : 'openai/gpt-oss-120b';

    const systemPrompt =
      dto.systemPrompt && dto.systemPrompt.trim().length > 0
        ? dto.systemPrompt
        : this.getDefaultSystemPrompt();

    if (existing) {
      return this.prisma.smsAiConfig.update({
        where: { id: existing.id },
        data: {
          provider: dto.provider || existing.provider || 'groq',
          model: selectedModel,
          apiKey: encryptedKey,
          systemPrompt,
          isActive: dto.isActive ?? existing.isActive,
          autoReplyEnabled: dto.autoReplyEnabled ?? existing.autoReplyEnabled,
          autoReplyMaxPerLead:
            dto.autoReplyMaxPerLead ?? existing.autoReplyMaxPerLead,
          maxCharacters: dto.maxCharacters ?? existing.maxCharacters,
        },
      });
    }

    return this.prisma.smsAiConfig.create({
      data: {
        provider: dto.provider || 'groq',
        model: selectedModel,
        apiKey: encryptedKey,
        systemPrompt,
        isActive: dto.isActive ?? true,
        autoReplyEnabled: dto.autoReplyEnabled ?? false,
        autoReplyMaxPerLead: dto.autoReplyMaxPerLead ?? 3,
        maxCharacters: dto.maxCharacters ?? 160,
      },
    });
  }

  /**
   * Generate an automated SMS reply using Groq LPU inference.
   * Strictly enforces character brevity <= 160 chars.
   */
  async generateAutoreply(args: SmsAiGenerateReplyArgs): Promise<{
    text: string;
    modelUsed: string;
  }> {
    const config = await this.prisma.smsAiConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let apiKey = '';
    if (config?.apiKey) {
      try {
        apiKey = decrypt(config.apiKey);
      } catch {
        apiKey = '';
      }
    }

    if (!apiKey) {
      apiKey = process.env.GROQ_API_KEY || '';
    }

    const provider = config?.provider || 'groq';
    let model = config?.model || 'openai/gpt-oss-120b';
    if (!model || model.includes('llama') || model.includes('mixtral')) {
      model = provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
    }
    const maxChars = config?.maxCharacters || 160;

    const leadName = args.leadName || 'Valued Client';
    const advisorName = args.advisorName || 'Advisory Team';
    const campaignTitle = args.originalCampaignTitle || 'Luxury Real Estate';
    const projectInfo = args.project
      ? `${args.project.name || 'Skyline Luxuria'}, ${args.project.city || 'Downtown'}`
      : 'BrokerOS Residences';

    const systemPrompt = `You are ${advisorName}, a senior real estate advisor with BrokerOS Realty representing ${projectInfo}.
Client / Lead Name: ${leadName}

PRIMARY OBJECTIVE:
Craft high-converting, single-segment real estate SMS replies to qualify the buyer (BHK/budget) or secure an on-site sample flat walkthrough.

STRICT SMS RULES:
1. BREVITY & SEGMENT CONTROL: Output MUST be between 90 and 150 characters total (strictly <= ${maxChars} chars). Aim for ~120 characters so messages never split across carrier segments.
2. NO EMOJIS: Never use emojis (emojis force carrier UCS-2 encoding which drops segment limits from 160 down to 70 characters and doubles costs). Plain standard text only.
3. NO MARKDOWN: Never use *bold*, **bold**, # headings, or bullets. SMS does not render markdown.
4. ALWAYS END WITH ONE CLEAR QUESTION:
   - Never send a dead-end statement. Always end with a single, punchy, low-friction question or alternative-choice CTA.
   - For visits: "Would Sat or Sun work better for a quick 15-min site visit?"
   - For qualification: "Are you primarily exploring a 2 or 3 BHK?"
   - For floor plans: "Reply YES if you'd like the layout sheet sent to your WhatsApp."
5. PRICING & DISCOUNTS: State starting price briefly if known; pivot discounts to in-person visit incentives.
6. ZERO PLACEHOLDERS (CRITICAL): Never output bracketed placeholders like [Name], [Agent], [Phone], or [Brokerage]. Sign off briefly as "- ${advisorName}" or omit sign-off if tight on space.
7. NO UNSOLICITED LINKS: Do not invent or include random URLs. Focus on building 2-way conversation momentum.`;

    // Construct conversation flow for LLM
    let userPrompt = '';
    if (args.messages && args.messages.length > 0) {
      const threadHistory = args.messages
        .slice(-6)
        .map(
          (m) =>
            `${m.direction === 'INBOUND' ? `[Client ${leadName}]` : `[Advisor]`}: ${m.text}`,
        )
        .join('\n');

      userPrompt = `Ongoing SMS conversation with prospective buyer "${leadName}":
${threadHistory}

Project: ${projectInfo}
Campaign: "${campaignTitle}"
${args.customInstructions ? `Instructions: ${args.customInstructions}` : ''}

Draft the next direct SMS reply from advisor to client (STRICTLY UNDER ${maxChars} CHARACTERS, NO EMOJIS, END WITH A PUNCHY QUESTION CTA).`;
    } else if (args.inboundBody) {
      userPrompt = `Inbound SMS from lead "${leadName}":
"${args.inboundBody}"

Project: ${projectInfo}
Campaign: "${campaignTitle}"
${args.customInstructions ? `Instructions: ${args.customInstructions}` : ''}

Draft a direct SMS reply answering their inquiry (STRICTLY UNDER ${maxChars} CHARACTERS, NO EMOJIS, END WITH A PUNCHY QUESTION CTA).`;
    } else {
      userPrompt = `Draft an initial outreach SMS to prospective homebuyer "${leadName}" regarding ${projectInfo}.
Keep it concise, strictly under 140 characters, NO emojis, and end with an alternative-choice question (e.g. 2 or 3 BHK layout).`;
    }

    if (apiKey) {
      try {
        const endpoint =
          provider === 'openai'
            ? 'https://api.openai.com/v1/chat/completions'
            : 'https://api.groq.com/openai/v1/chat/completions';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 90,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let replyText = data.choices?.[0]?.message?.content?.trim() || '';
          if (replyText.startsWith('"') && replyText.endsWith('"')) {
            replyText = replyText.slice(1, -1);
          }
          // Remove any accidental markdown or bracketed placeholders, and strip non-ASCII emojis for GSM-7 safety
          replyText = replyText
            .replace(/\[.*?\]/g, '')
            .replace(/\*\*.*?\*\*/g, '')
            .replace(/\*.*?\*/g, (match: string) => match.replace(/\*/g, ''))
            .replace(/[^\x00-\x7F]/g, '')
            .trim();
          if (replyText.length > maxChars) {
            replyText = replyText.slice(0, maxChars - 3) + '...';
          }
          if (replyText) {
            return {
              text: replyText,
              modelUsed: model,
            };
          }
        }
      } catch (err: any) {
        this.logger.error(`AI API call failed: ${err.message}`);
      }
    }

    // Dynamic contextual fallback without links, strictly under 160 characters
    const fallbackTemplates = [
      `Hi ${leadName}, thanks for inquiring on ${projectInfo.slice(0, 25)}! Are you looking for a 2 or 3 BHK layout? - ${advisorName}`,
      `Hi ${leadName}, sample flat tours for ${projectInfo.slice(0, 25)} are open. Would Sat or Sun suit you for a quick walkthrough? - ${advisorName}`,
      `Hi ${leadName}, only a few units left at ${projectInfo.slice(0, 25)}. Want to review floor plans this week? Reply YES. - ${advisorName}`,
    ];
    const pickedFallback =
      fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];

    return {
      text: pickedFallback.slice(0, maxChars),
      modelUsed: 'context-fallback',
    };
  }

  private getDefaultSystemPrompt(): string {
    return `You are a senior real estate advisor with BrokerOS Realty.
Your task is to craft high-converting, single-segment SMS replies (strictly under 160 characters) to qualify prospective home buyers and schedule sample flat site visits.
Rules:
1. Strictly under 160 characters (GSM-7 single segment standard). Aim for 110-140 chars.
2. NO emojis (avoids UCS-2 character penalty). Plain ASCII text only.
3. NO markdown (*bold*, bullets).
4. Always end with a single, low-friction question or CTA (e.g. "Would Sat or Sun work for a quick site tour?").
5. Never output bracketed placeholders like [Name] or [Phone].`;
  }
}
