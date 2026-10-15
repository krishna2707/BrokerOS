// ============================================================================
// BrokerOS — Email AI Assistant & Autoreply Service (Groq openai/gpt-oss-120b)
// ============================================================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { encrypt, decrypt } from '@brokeros/int-whatsapp';
import type { SaveEmailAiConfigDto } from '../dto/email-flows.dto.js';

export interface EmailAiGenerateReplyArgs {
  leadName?: string;
  advisorName?: string;
  inboundSubject?: string;
  inboundBody?: string;
  originalCampaignTitle?: string;
  originalSubject?: string;
  project?: {
    name?: string;
    city?: string;
    address?: string;
    description?: string;
    amenities?: string[];
    brochureUrl?: string;
  } | null;
  messages?: Array<{
    direction: string;
    senderName?: string;
    subject?: string;
    bodyText: string;
  }>;
  customInstructions?: string;
}

@Injectable()
export class EmailAiService {
  private readonly logger = new Logger(EmailAiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active Email AI configuration. Masked API key.
   */
  async getAiConfig() {
    const config = await this.prisma.emailAiConfig.findFirst({
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
      };
    }

    return {
      ...config,
      apiKey: config.apiKey ? '••••••••' : null,
    };
  }

  /**
   * Save or update Email AI configuration.
   */
  async saveAiConfig(dto: SaveEmailAiConfigDto) {
    const existing = await this.prisma.emailAiConfig.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let encryptedKey = existing?.apiKey || '';
    if (dto.apiKey === '' || dto.apiKey === null) {
      encryptedKey = '';
    } else if (dto.apiKey && dto.apiKey !== '••••••••') {
      encryptedKey = encrypt(dto.apiKey.trim());
    }

    // Default to openai/gpt-oss-120b as requested
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
      return this.prisma.emailAiConfig.update({
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
        },
      });
    }

    return this.prisma.emailAiConfig.create({
      data: {
        provider: dto.provider || 'groq',
        model: selectedModel,
        apiKey: encryptedKey,
        systemPrompt,
        isActive: dto.isActive ?? true,
        autoReplyEnabled: dto.autoReplyEnabled ?? false,
        autoReplyMaxPerLead: dto.autoReplyMaxPerLead ?? 3,
      },
    });
  }

  /**
   * Generates an intelligent real estate reply using Groq (openai/gpt-oss-120b)
   */
  async generateAutoreply(args: EmailAiGenerateReplyArgs): Promise<{
    subject: string;
    textBody: string;
    htmlBody: string;
  }> {
    const config = await this.prisma.emailAiConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let provider = config?.provider || 'groq';
    let model = config?.model || 'openai/gpt-oss-120b';
    if (!model || model.includes('llama') || model.includes('mixtral')) {
      model = provider === 'groq' ? 'openai/gpt-oss-120b' : 'gpt-4o-mini';
    }
    let rawApiKey = '';

    if (config?.apiKey) {
      try {
        rawApiKey = decrypt(config.apiKey);
      } catch {
        this.logger.warn(
          'Failed to decrypt custom Email AI key, falling back to .env',
        );
      }
    }

    // Fallback to environment variables
    if (!rawApiKey) {
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
        rawApiKey = process.env.GROQ_API_KEY;
        if (!model || model.includes('llama') || model.includes('mixtral')) {
          model = 'openai/gpt-oss-120b';
        }
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai';
        rawApiKey = process.env.OPENAI_API_KEY;
        model = 'gpt-4o-mini';
      }
    }

    // Build context entities
    const clientName = args.leadName || 'Valued Client';
    const advisorName = args.advisorName || 'Property Advisory Consultant';
    const projectName =
      args.project?.name ||
      args.originalCampaignTitle ||
      'Our Premier Residential Project';
    const projectCity = args.project?.city || 'the prime city center';
    const amenities =
      args.project?.amenities?.join(', ') ||
      'Clubhouse, Swimming Pool, High-speed Elevators, 24/7 Security';

    const defaultBasePrompt = `You are ${advisorName}, a senior real estate advisor and concierge with BrokerOS Realty & Advisory representing *${projectName}* in ${projectCity}.
Client / Lead Name: ${clientName}

PRIMARY OBJECTIVE:
Respond to prospective home buyers and investors with executive warmth, provide transparent property insights, qualify buying intent (BHK configuration, budget, move-in timeline), and guide them toward scheduling a private walkthrough of our model residences or a brief consultation call. Real estate transactions are sealed through in-person experience.

TACTICAL EMAIL CONVERSATION RULES:
1. STRUCTURE & BREVITY (70 to 140 WORDS):
   - Keep paragraphs short (2 to 3 sentences each) for effortless mobile reading.
   - Paragraph 1: Warm personalized opening acknowledging their specific inquiry regarding ${projectName}.
   - Paragraph 2: Direct, transparent insights covering key highlights (${amenities}) and transparent starting pricing.
   - Paragraph 3: Consultative, low-friction call-to-action proposing a private sample flat tour or brief discussion.
2. THE ASSUMPTIVE SITE VISIT CLOSE:
   - Propose specific viewing windows: "We are coordinating private guided tours of the model residences this Thursday and over the weekend. Would morning or late afternoon suit your schedule best?"
3. PRICING & PAYMENT PLANS:
   - State transparent starting prices when available. For discounts, customized payment milestone plans (e.g. flexible construction-linked schemes), or floor rise charges, invite them to explore spot-booking advantages during their private viewing.
4. BROCHURES & FLOOR PLANS:
   - If the client requests layouts or brochures, confirm that detailed floor plans and current availability are shared, and follow up with a preference question (e.g. 2 vs 3 BHK, or preferred floor levels).
5. ABSOLUTELY ZERO PLACEHOLDERS (CRITICAL):
   - NEVER output bracketed placeholders like [Your Name], **Your Name**, [Agent Name], [Company Name], [Phone Number], or [Insert Link].
   - Always sign off cleanly as:
     Warm regards,
     ${advisorName}
     BrokerOS Advisory Team
6. TONE & VARIETY:
   - Executive, consultative, articulate, and welcoming. Never pushy or robotic.
   - Provide fresh phrasing and distinct tone each time.
7. FORMAT:
   - Return your answer strictly as a JSON object:
     {
       "subject": "compelling, personalized subject line",
       "body": "email text in clean paragraphs separated by double newlines"
     }`;

    const injectedSystemPrompt = config?.systemPrompt
      ? `${config.systemPrompt}\n\nREAL ESTATE CONTEXT:\n- Brokerage: BrokerOS Realty & Advisory\n- Advisor Name: ${advisorName}\n- Project Name: ${projectName} (${projectCity})\n- Highlights & Amenities: ${amenities}\n- Client Name: ${clientName}\n${args.project?.brochureUrl ? `- Digital Brochure Link: ${args.project.brochureUrl}\n` : ''}CRITICAL: Never output placeholders like [Your Name]. Always propose a private site tour or 10-minute briefing.`
      : defaultBasePrompt;

    let userPrompt = '';
    if (args.messages && args.messages.length > 0) {
      const threadHistory = args.messages
        .slice(-6)
        .map(
          (m) =>
            `${m.direction === 'INBOUND' ? `[Client: ${clientName}]` : `[Advisor: ${advisorName}]`}:\nSubject: ${m.subject || ''}\n${m.bodyText}`,
        )
        .join('\n\n---\n\n');

      userPrompt = `Ongoing email correspondence with client "${clientName}":

${threadHistory}

Draft the next executive email response from Advisor "${advisorName}" to client "${clientName}". Return strictly JSON: { "subject": "...", "body": "..." }.`;
    } else if (args.inboundBody) {
      userPrompt = `Inbound email inquiry from "${clientName}":
Subject: ${args.inboundSubject || args.originalSubject || 'Property Inquiry'}
Body:
"${args.inboundBody}"

Project: ${projectName} (${projectCity})
${args.customInstructions ? `Special Instructions: ${args.customInstructions}\n` : ''}
Draft a professional, helpful email reply answering their inquiry directly and inviting them to an on-site sample flat viewing. Return strictly JSON: { "subject": "...", "body": "..." }.`;
    } else {
      userPrompt = `Draft an initial outreach email to prospective homebuyer "${clientName}" from Advisor "${advisorName}" regarding ${projectName} (${projectCity}).
Highlight key amenities (${amenities}), offer priority floor plans, and invite them for a private walkthrough this week. Return strictly JSON: { "subject": "...", "body": "..." }.`;
    }

    if (rawApiKey) {
      try {
        const endpoint =
          provider === 'openai'
            ? 'https://api.openai.com/v1/chat/completions'
            : 'https://api.groq.com/openai/v1/chat/completions';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${rawApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: injectedSystemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 600,
            temperature: 0.8,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData?.choices?.[0]?.message?.content?.trim() || '';

          let parsedSubject = '';
          let parsedBody = '';

          try {
            // Try extracting JSON block
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              parsedSubject = parsed.subject;
              parsedBody = parsed.body;
            }
          } catch {
            // Fallback: use raw text
          }

          if (!parsedBody) {
            parsedBody = content
              .replace(/```json[\s\S]*?```/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .trim();
          }

          // Clean any stray placeholders
          parsedBody = parsedBody
            .replace(/\[Your Name\]/gi, advisorName)
            .replace(/\*\*Your Name\*\*/gi, advisorName)
            .replace(/\[Company Name\]/gi, 'BrokerOS Realty')
            .replace(/\[Phone Number\]/gi, '+1 800 BROKEROS');

          if (!parsedSubject) {
            parsedSubject = args.inboundSubject?.startsWith('Re:')
              ? args.inboundSubject
              : `Re: ${args.inboundSubject || args.originalSubject || projectName}`;
          }

          const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px;">
  ${parsedBody
    .split('\n\n')
    .map(
      (p: string) =>
        `<p style="margin-bottom: 12px;">${p.replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')}
</div>`;

          return {
            subject: parsedSubject,
            textBody: parsedBody,
            htmlBody,
          };
        }
      } catch (err: any) {
        this.logger.error(`AI generation failure: ${err?.message}`);
      }
    }

    // Dynamic contextual fallback
    const fallbackSubjects = [
      `${projectName} (${projectCity}) - Pricing & Sample Flat Walkthrough for ${clientName}`,
      `Re: Your inquiry regarding ${projectName}`,
      `Exclusive Floor Plans & Availability: ${projectName}`,
    ];
    const pickedSubject = args.inboundSubject?.startsWith('Re:')
      ? args.inboundSubject
      : args.inboundSubject
        ? `Re: ${args.inboundSubject}`
        : args.originalSubject ||
          fallbackSubjects[Math.floor(Math.random() * fallbackSubjects.length)];

    const fallbackBodies = [
      `Hello ${clientName},\n\nThank you for reaching out regarding ${projectName} in ${projectCity}. We have newly released inventory featuring spacious layouts, premium finishes, and world-class amenities including ${amenities}.\n\nWe are currently hosting private guided walkthroughs of our model residences. Would Thursday afternoon or this weekend work best for you to visit the property?\n\nWarm regards,\n${advisorName}\nBrokerOS Advisory Team`,
      `Dear ${clientName},\n\nFollowing up on your interest in ${projectName}, I wanted to share our latest availability sheet and customized payment milestone options.\n\nSeeing the actual space and sample flat makes evaluating the layout much easier. Would you have 15 minutes this weekend for a brief private tour?\n\nWarm regards,\n${advisorName}\nBrokerOS Advisory Team`,
    ];
    const pickedBody =
      fallbackBodies[Math.floor(Math.random() * fallbackBodies.length)];

    const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px;">
  ${pickedBody
    .split('\n\n')
    .map(
      (p) => `<p style="margin-bottom: 12px;">${p.replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')}
</div>`;

    return {
      subject: pickedSubject,
      textBody: pickedBody,
      htmlBody,
    };
  }

  /**
   * Alias for generateAutoreply
   */
  async generateAiReply(args: EmailAiGenerateReplyArgs) {
    return this.generateAutoreply(args);
  }

  private getDefaultSystemPrompt(): string {
    return `You are a senior real estate sales advisor and concierge with BrokerOS Realty & Advisory.
Your role is to respond to prospective home buyers with executive warmth, provide transparent property insights, answer pricing and floor plan questions, qualify buying intent (BHK/timeline), and invite them for an on-site sample flat walkthrough.
Rules:
1. Keep email bodies between 70 to 140 words in 2-3 clean, readable paragraphs.
2. Never output bracketed placeholders like [Your Name] or [Phone Number].
3. Always include a consultative call-to-action (e.g. proposing a private viewing this week).
4. For discounts or customized payment schemes, invite the client to explore spot-booking advantages during their visit.`;
  }
}
