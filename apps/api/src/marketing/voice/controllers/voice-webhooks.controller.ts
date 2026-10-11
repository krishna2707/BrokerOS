import {
  Controller,
  Post,
  Get,
  Param,
  Headers,
  Body,
  Query,
  Header,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { VoiceTrackingService } from '../services/voice-tracking.service.js';
import { getVoiceAgentProvider } from '@brokeros/int-voice';
import type { VoiceAgentPlatform } from '@brokeros/types';

@Public()
@Controller('api/marketing/voice/webhooks')
export class VoiceWebhooksController {
  constructor(private readonly trackingService: VoiceTrackingService) {}

  @Get('vobiz-answer')
  @Post('vobiz-answer')
  @Header('Content-Type', 'text/xml')
  handleVobizAnswer(
    @Query('campaignId') campaignId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('firstMessage') firstMessage?: string,
    @Query('agent') agentPlatform?: string,
    @Query('voice') voiceId?: string,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    if (res) {
      res.type('text/xml');
    }

    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const wsUrl = publicUrl.replace(/^http/i, 'ws') + '/voice/stream';
    const plat = (agentPlatform || 'OPENAI_REALTIME').toUpperCase();

    if (plat === 'VAPI') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:assistant@sip.vapi.ai</Sip>
  </Dial>
</Response>`;
    }

    if (plat === 'RETELL') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:agent@sip.retellai.com</Sip>
  </Dial>
</Response>`;
    }

    // Vobiz Media Stream Response
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="campaignId" value="${campaignId || 'direct_test'}"/>
      <Parameter name="recipientId" value="${recipientId || ''}"/>
      <Parameter name="agent" value="${plat}"/>
      <Parameter name="voiceId" value="${voiceId || 'alloy'}"/>
    </Stream>
  </Connect>
</Response>`;
  }

  @Get('twilio-answer')
  @Post('twilio-answer')
  @Header('Content-Type', 'text/xml')
  handleTwilioAnswer(
    @Query('campaignId') campaignId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('firstMessage') firstMessage?: string,
    @Query('agent') agentPlatform?: string,
    @Query('voice') voiceId?: string,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    if (res) {
      res.type('text/xml');
    }

    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const wsUrl = publicUrl.replace(/^http/i, 'ws') + '/voice/stream';
    const plat = (agentPlatform || 'OPENAI_REALTIME').toUpperCase();

    if (plat === 'VAPI') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:assistant@sip.vapi.ai</Sip>
  </Dial>
</Response>`;
    }

    if (plat === 'RETELL') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:agent@sip.retellai.com</Sip>
  </Dial>
</Response>`;
    }

    // Twilio Bi-directional Media Stream Response
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="campaignId" value="${campaignId || 'direct_test'}"/>
      <Parameter name="recipientId" value="${recipientId || ''}"/>
      <Parameter name="agent" value="${plat}"/>
      <Parameter name="voiceId" value="${voiceId || 'alloy'}"/>
    </Stream>
  </Connect>
</Response>`;
  }

  @Get('telnyx-answer')
  @Post('telnyx-answer')
  @Header('Content-Type', 'text/xml')
  handleTelnyxAnswer(
    @Query('campaignId') campaignId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('firstMessage') firstMessage?: string,
    @Query('agent') agentPlatform?: string,
    @Query('voice') voiceId?: string,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const wsUrl = publicUrl.replace(/^http/i, 'ws') + '/voice/stream';
    const plat = (agentPlatform || 'OPENAI_REALTIME').toUpperCase();

    if (res) {
      res.type('text/xml');
    }

    if (plat === 'VAPI') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:assistant@sip.vapi.ai</Sip>
  </Dial>
</Response>`;
    }

    if (plat === 'RETELL') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>sip:agent@sip.retellai.com</Sip>
  </Dial>
</Response>`;
    }

    // Telnyx TeXML Media Stream
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="campaignId" value="${campaignId || 'direct_call'}"/>
      <Parameter name="recipientId" value="${recipientId || ''}"/>
      <Parameter name="agent" value="${plat}"/>
      <Parameter name="voiceId" value="${voiceId || 'alloy'}"/>
    </Stream>
  </Connect>
</Response>`;
  }

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') providerName: string,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>,
    @Body() body: any,
    @Res({ passthrough: true }) res?: Response,
  ) {
    // 1. Dedicated Handler for Twilio Answer Webhook
    if (providerName === 'twilio-answer') {
      return this.handleTwilioAnswer(
        query.campaignId,
        query.recipientId,
        query.firstMessage,
        query.agent,
        query.voice,
        res,
      );
    }

    // 2. Dedicated Handler for Vobiz Answer Webhook
    if (providerName === 'vobiz-answer') {
      return this.handleVobizAnswer(
        query.campaignId,
        query.recipientId,
        query.firstMessage,
        query.agent,
        query.voice,
        res,
      );
    }

    // 3. Dedicated Handler for Telnyx Answer Webhook
    if (providerName === 'telnyx-answer') {
      return this.handleTelnyxAnswer(
        query.campaignId,
        query.recipientId,
        query.firstMessage,
        query.agent,
        query.voice,
        res,
      );
    }

    // 4. Voice Agent Platform Webhook Events (Vapi, Retell, ElevenLabs, Sarvam)
    const platform = providerName.toUpperCase() as VoiceAgentPlatform;

    try {
      const provider = getVoiceAgentProvider(platform);
      const events = provider.parseWebhookEvent(headers, body);

      if (events.length > 0) {
        await this.trackingService.processWebhookEvents(events);
      }

      return { success: true, processed: events.length };
    } catch {
      return { success: true };
    }
  }
}
