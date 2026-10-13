import {
  Controller,
  Post,
  Req,
  Res,
  Query,
  Body,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../lib/database/prisma.service.js';
import { CallRecordsService } from '../leads/call-records/call-records.service.js';
import { CrmTelephonyService } from './crm-telephony.service.js';
import { put } from '@vercel/blob';

@Controller(['api/crm/telephony/webhooks', 'telephony/webhooks'])
export class CrmTelephonyWebhooksController {
  private readonly logger = new Logger(CrmTelephonyWebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly callRecordsService: CallRecordsService,
    private readonly telephonyService: CrmTelephonyService,
  ) { }

  /**
   * Twilio Voice TwiML webhook:
   * Called by Twilio when an in-browser softphone initiates an outbound call.
   */
  @Post('twilio-voice')
  async handleTwilioVoice(@Req() req: any, @Res() res: Response) {
    const toPhone = req.body?.To || req.query?.To || '';
    const callSid = req.body?.CallSid || req.query?.CallSid || '';
    const callRecordId = req.body?.callRecordId || req.query?.callRecordId || '';

    this.logger.log(`[TwilioVoice Webhook] Dial request to ${toPhone} (CallSid: ${callSid})`);

    const raw = await this.telephonyService.getRawActiveConfig();
    const callerId = raw?.fromNumbers?.[0] || req.body?.From || '+15550001234';

    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const recordingCallback = publicUrl
      ? `${publicUrl}/api/crm/telephony/webhooks/twilio-recording?callRecordId=${encodeURIComponent(callRecordId)}`
      : '';
    const statusCallback = publicUrl
      ? `${publicUrl}/api/crm/telephony/webhooks/twilio-status?callRecordId=${encodeURIComponent(callRecordId)}`
      : '';

    // If callRecordId exists, link providerCallId
    if (callRecordId) {
      await this.prisma.callRecord.update({
        where: { id: callRecordId },
        data: {
          providerCallId: callSid,
          status: 'CONNECTED',
        },
      }).catch((e) => this.logger.warn(`Could not update CallRecord: ${e.message}`));
    }

    const cleanTo = toPhone.replace(/[^\d+]/g, '');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${this.escapeXml(callerId)}" record="record-from-answer-dual" ${recordingCallback ? `recordingStatusCallback="${this.escapeXml(recordingCallback)}"` : ''}>
    <Number ${statusCallback ? `statusCallback="${this.escapeXml(statusCallback)}" statusCallbackEvent="initiated ringing answered completed"` : ''}>${this.escapeXml(cleanTo)}</Number>
  </Dial>
</Response>`;

    res.set('Content-Type', 'text/xml');
    return res.send(twiml);
  }

  /**
   * Twilio Call Status Callback:
   * Updates CallRecord status and resets user on-call flag when call ends.
   */
  @Post('twilio-status')
  async handleTwilioStatus(@Req() req: any, @Query('callRecordId') queryId: string, @Res() res: Response) {
    const callSid = req.body?.CallSid || '';
    const callStatus = (req.body?.CallStatus || req.body?.CallDuration ? 'completed' : '').toLowerCase();
    const duration = parseInt(req.body?.CallDuration || '0', 10);
    const callRecordId = queryId || req.body?.callRecordId;

    this.logger.log(`[TwilioStatus Webhook] CallSid: ${callSid}, Status: ${callStatus}, Duration: ${duration}s`);

    const record = callRecordId
      ? await this.prisma.callRecord.findUnique({ where: { id: callRecordId } })
      : await this.prisma.callRecord.findFirst({ where: { providerCallId: callSid } });

    if (record) {
      const updateData: any = {};
      if (callStatus === 'completed') {
        updateData.endedAt = new Date();
        if (duration > 0) updateData.duration = duration;
      }

      await this.prisma.callRecord.update({
        where: { id: record.id },
        data: updateData,
      });

      // Clear user on-call status
      if (record.userId && (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer')) {
        await this.prisma.user.update({
          where: { id: record.userId },
          data: { isOnCall: false },
        });
      }
    }

    return res.status(200).send({ received: true });
  }

  /**
   * Twilio Recording Callback:
   * Downloads call audio, uploads to Vercel Blob, updates CallRecord, and triggers Groq Whisper transcription.
   */
  @Post('twilio-recording')
  async handleTwilioRecording(
    @Req() req: any,
    @Query('callRecordId') queryId: string,
    @Res() res: Response,
  ) {
    const recordingUrl = req.body?.RecordingUrl;
    const recordingSid = req.body?.RecordingSid;
    const duration = parseInt(req.body?.RecordingDuration || '0', 10);
    const callSid = req.body?.CallSid;
    const callRecordId = queryId || req.body?.callRecordId;

    this.logger.log(`[TwilioRecording Webhook] RecordingSid: ${recordingSid}, Duration: ${duration}s, URL: ${recordingUrl}`);

    if (!recordingUrl) {
      return res.status(400).send({ error: 'Missing RecordingUrl' });
    }

    const record = callRecordId
      ? await this.prisma.callRecord.findUnique({ where: { id: callRecordId } })
      : await this.prisma.callRecord.findFirst({ where: { providerCallId: callSid } });

    if (!record) {
      this.logger.warn(`No CallRecord found for RecordingSid: ${recordingSid}`);
      return res.status(200).send({ received: true, warning: 'CallRecord not found' });
    }

    // Acknowledge carrier immediately
    res.status(200).send({ received: true });

    const raw = await this.telephonyService.getRawActiveConfig();
    const authHeader = raw?.accountSid && raw?.authToken
      ? `Basic ${Buffer.from(`${raw.accountSid}:${raw.authToken}`).toString('base64')}`
      : undefined;

    const audioUrl = recordingUrl.endsWith('.mp3') ? recordingUrl : `${recordingUrl}.mp3`;
    this.processRecordingAudio(record.id, audioUrl, duration, authHeader);
  }

  /**
   * Telnyx TeXML Call Webhook:
   * Returns TeXML instructions to connect the lead to the agent phone with dual recording.
   */
  @Post('telnyx-voice')
  async handleTelnyxVoice(@Req() req: any, @Query() query: any, @Res() res: Response) {
    const callRecordId = query?.callRecordId || req.body?.callRecordId || '';
    const agentPhone = query?.agentPhone || req.body?.agentPhone || req.body?.To || '';
    const cleanAgent = agentPhone.replace(/[^\d+]/g, '');

    this.logger.log(`[TelnyxVoice] Webhook answered for CallRecord: ${callRecordId}, Agent: ${cleanAgent}`);

    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const recordingCallback = publicUrl
      ? `${publicUrl}/api/crm/telephony/webhooks/telnyx-recording?callRecordId=${encodeURIComponent(callRecordId)}`
      : '';

    const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial record="record-from-answer" ${recordingCallback ? `recordingStatusCallback="${this.escapeXml(recordingCallback)}"` : ''}>
    <Number>${this.escapeXml(cleanAgent)}</Number>
  </Dial>
</Response>`;

    res.set('Content-Type', 'text/xml');
    return res.send(texml);
  }

  /**
   * Telnyx Recording Callback:
   * Downloads audio, uploads to Vercel Blob, updates CallRecord, and enqueues Groq Whisper AI transcription.
   */
  @Post('telnyx-recording')
  async handleTelnyxRecording(@Req() req: any, @Query('callRecordId') queryId: string, @Res() res: Response) {
    const recordingUrl = req.body?.recording_url || req.body?.data?.payload?.recording_url || req.body?.RecordingUrl;
    const duration = parseInt(req.body?.duration || req.body?.data?.payload?.duration || '0', 10);
    const callRecordId = queryId || req.body?.callRecordId;

    this.logger.log(`[TelnyxRecording] Callback received for CallRecord ${callRecordId}: ${recordingUrl}`);

    res.status(200).send({ received: true });

    if (callRecordId && recordingUrl) {
      this.processRecordingAudio(callRecordId, recordingUrl, duration);
    }
  }

  /**
   * Exotel Call Status Callback:
   * Receives status & recording url when Exotel finishes bridging the call.
   */
  @Post('exotel-status')
  async handleExotelStatus(@Req() req: any, @Query('callRecordId') queryId: string, @Res() res: Response) {
    const callSid = req.body?.CallSid || req.body?.Call?.Sid || '';
    const status = (req.body?.Status || req.body?.Call?.Status || '').toLowerCase();
    const recordingUrl = req.body?.RecordingUrl || req.body?.Call?.RecordingUrl;
    const duration = parseInt(req.body?.CallDuration || req.body?.Duration || '0', 10);
    const callRecordId = queryId || req.body?.callRecordId;

    this.logger.log(`[ExotelStatus] Sid: ${callSid}, Status: ${status}, RecordingUrl: ${recordingUrl}`);

    const record = callRecordId
      ? await this.prisma.callRecord.findUnique({ where: { id: callRecordId } })
      : await this.prisma.callRecord.findFirst({ where: { providerCallId: callSid } });

    if (record) {
      const updateData: any = {};
      if (status === 'completed') {
        updateData.endedAt = new Date();
        if (duration > 0) updateData.duration = duration;
      }
      await this.prisma.callRecord.update({
        where: { id: record.id },
        data: updateData,
      });

      if (record.userId && (status === 'completed' || status === 'busy' || status === 'failed' || status === 'no-answer')) {
        await this.prisma.user.update({
          where: { id: record.userId },
          data: { isOnCall: false },
        });
      }

      if (recordingUrl) {
        const raw = await this.telephonyService.getRawActiveConfig();
        const authHeader = raw?.apiKey && raw?.apiToken
          ? `Basic ${Buffer.from(`${raw.apiKey}:${raw.apiToken}`).toString('base64')}`
          : undefined;
        this.processRecordingAudio(record.id, recordingUrl, duration, authHeader);
      }
    }

    return res.status(200).send({ received: true });
  }

  /**
   * Vobiz Answer Webhook:
   * Called by Vobiz when the lead answers; returns Vobiz XML to bridge to the agent's phone.
   */
  @Post('vobiz-answer')
  async handleVobizAnswer(@Req() req: any, @Query() query: any, @Res() res: Response) {
    const callRecordId = query?.callRecordId || req.body?.callRecordId || '';
    const agentPhone = query?.agentPhone || req.body?.agentPhone || '';
    const cleanAgent = agentPhone.replace(/[^\d+]/g, '');

    this.logger.log(`[VobizAnswer] Webhook answered for CallRecord: ${callRecordId}, Agent: ${cleanAgent}`);

    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
    const recordingCallback = publicUrl
      ? `${publicUrl}/api/crm/telephony/webhooks/vobiz-recording?callRecordId=${encodeURIComponent(callRecordId)}`
      : '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial record="true" ${recordingCallback ? `recordingStatusCallback="${this.escapeXml(recordingCallback)}"` : ''}>
    <Number>${this.escapeXml(cleanAgent)}</Number>
  </Dial>
</Response>`;

    res.set('Content-Type', 'text/xml');
    return res.send(xml);
  }

  /**
   * Vobiz Recording Callback:
   * Downloads audio, uploads to Vercel Blob, updates CallRecord, and enqueues AI transcription.
   */
  @Post('vobiz-recording')
  async handleVobizRecording(@Req() req: any, @Query('callRecordId') queryId: string, @Res() res: Response) {
    const recordingUrl = req.body?.recording_url || req.body?.RecordingUrl || req.body?.url;
    const duration = parseInt(req.body?.duration || req.body?.RecordingDuration || '0', 10);
    const callRecordId = queryId || req.body?.callRecordId;

    this.logger.log(`[VobizRecording] Callback received for CallRecord ${callRecordId}: ${recordingUrl}`);

    res.status(200).send({ received: true });

    if (callRecordId && recordingUrl) {
      this.processRecordingAudio(callRecordId, recordingUrl, duration);
    }
  }

  /**
   * Shared helper: Downloads recording audio from carrier, uploads to Vercel Blob,
   * updates CallRecord, clears agent on-call state, and enqueues Groq Whisper AI transcription.
   */
  private async processRecordingAudio(
    callRecordId: string,
    recordingUrl: string,
    duration?: number,
    authHeader?: string,
  ) {
    const record = await this.prisma.callRecord.findUnique({
      where: { id: callRecordId },
    });
    if (!record) {
      this.logger.warn(`No CallRecord found for id: ${callRecordId}`);
      return;
    }

    try {
      const mediaRes = await fetch(recordingUrl, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });

      if (!mediaRes.ok) {
        throw new Error(`Failed to fetch recording audio: HTTP ${mediaRes.status}`);
      }

      const audioBuffer = Buffer.from(await mediaRes.arrayBuffer());
      const targetId = record.leadId || record.brokerId || 'unknown';
      const blob = await put(
        `calls/${targetId}-${Date.now()}-${record.id}.mp3`,
        audioBuffer,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        },
      );

      await this.prisma.callRecord.update({
        where: { id: record.id },
        data: {
          recordingUrl: blob.url,
          recordingSize: audioBuffer.length,
          duration: duration || record.duration,
          endedAt: record.endedAt || new Date(),
          status: 'CONNECTED',
        },
      });

      if (record.userId) {
        await this.prisma.user.update({
          where: { id: record.userId },
          data: { isOnCall: false },
        });
      }

      await this.callRecordsService.enqueueAudioTranscription(record.id, audioBuffer);
      this.logger.log(`[Telephony Webhook] Saved recording to blob and enqueued AI transcription for CallRecord ${record.id}`);
    } catch (err: any) {
      this.logger.error(`[Telephony Webhook Error] Failed to process audio: ${err.message}`, err.stack);
    }
  }

  /**
   * Mock Call Simulation Endpoint:
   * Enables local end-to-end dev testing without live carrier credentials.
   */
  @Post('mock-call')
  async handleMockCall(@Body() body: { callRecordId: string; duration?: number }) {
    const { callRecordId, duration = 30 } = body;
    const record = await this.prisma.callRecord.findUnique({
      where: { id: callRecordId },
    });

    if (!record) return { error: 'CallRecord not found' };

    await this.prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        status: 'CONNECTED',
        duration,
        endedAt: new Date(),
        aiTranscript: 'Agent: Hello, this is John Doe from BrokerOS calling regarding your luxury 3BHK penthouse inquiry. Lead: Yes, my budget is around 2.5 Cr and I am interested in visiting the project this Saturday. Agent: Perfect, I have scheduled the site visit for Saturday at 11 AM.',
        aiSummary: 'Customer confirmed interest in 3BHK luxury unit. Budget is approximately 2.5 Cr. Site visit scheduled for Saturday 11 AM.',
        aiSentiment: 'POSITIVE',
      },
    });

    if (record.userId) {
      await this.prisma.user.update({
        where: { id: record.userId },
        data: { isOnCall: false },
      });
    }

    return { success: true, message: 'Mock call completed and processed.' };
  }

  private escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
