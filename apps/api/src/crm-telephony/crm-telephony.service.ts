import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../lib/database/prisma.service.js';
import { getVoiceTelephonyProvider } from '@brokeros/int-voice';
import { VoiceTelephonyType } from '@brokeros/prisma';
import type {
  ConnectCrmTelephonyDto,
  InitiateCrmCallDto,
  VerifyCrmTelephonyDto,
} from './dto/crm-telephony.dto.js';

@Injectable()
export class CrmTelephonyService {
  private readonly logger = new Logger(CrmTelephonyService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Returns the company-wide active telephony provider configuration,
   * masking secret keys for safe UI presentation.
   */
  async getActiveConfig() {
    const config = await this.prisma.crmTelephonyConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) return null;

    return {
      id: config.id,
      provider: config.provider,
      name: config.name,
      isActive: config.isActive,
      accountSid: config.accountSid ? this.maskKey(config.accountSid) : null,
      apiKey: config.apiKey ? this.maskKey(config.apiKey) : null,
      subdomain: config.subdomain || null,
      sipDomain: config.sipDomain || null,
      fromNumbers: config.fromNumbers || [],
      applicationSid: config.applicationSid ? this.maskKey(config.applicationSid) : null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Internal method returning raw unmasked credentials for routing & token minting.
   */
  async getRawActiveConfig() {
    return this.prisma.crmTelephonyConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Connects and verifies a single active telephony provider for the organization.
   * If another carrier is already active, it is deactivated first.
   */
  async connectProvider(dto: ConnectCrmTelephonyDto) {
    this.logger.log(`[CrmTelephony] Connecting provider: ${dto.provider} (${dto.name})`);

    const providerClient = getVoiceTelephonyProvider(dto.provider, {
      accountSid: dto.accountSid,
      authToken: dto.authToken,
      apiKey: dto.apiKey,
      apiToken: dto.apiToken,
      subdomain: dto.subdomain,
      sipDomain: dto.sipDomain,
    });

    // Validate credentials against carrier API
    const isValid = await providerClient.validateCredentials({
      accountSid: dto.accountSid,
      authToken: dto.authToken,
      apiKey: dto.apiKey,
      apiToken: dto.apiToken,
      subdomain: dto.subdomain,
      sipDomain: dto.sipDomain,
    });

    if (!isValid) {
      throw new BadRequestException(
        `Failed to validate credentials with telephony carrier ${dto.provider}. Please verify your Account SID, Auth Token / API Key, and carrier permissions.`,
      );
    }

    // For Twilio: ensure a dedicated API Key (SK...) exists for in-browser WebRTC tokens
    if (dto.provider === 'TWILIO' && dto.accountSid && dto.authToken) {
      if (!dto.apiKey || !dto.apiKey.startsWith('SK')) {
        const keyResult = await this.ensureTwilioApiKey(dto.accountSid, dto.authToken);
        if (keyResult) {
          dto.apiKey = keyResult.apiKey;
          dto.apiToken = keyResult.apiSecret;
        }
      }

      if (!dto.applicationSid) {
        const autoAppSid = await this.ensureTwilioApplication(dto.accountSid, dto.authToken);
        if (autoAppSid) {
          dto.applicationSid = autoAppSid;
        }
      }
    }

    // Single active provider law: deactivate all existing configs
    await this.prisma.crmTelephonyConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const uniqueNumbers = Array.from(
      new Set((dto.fromNumbers || []).map((n) => n.trim())),
    ).filter(Boolean);

    const saved = await this.prisma.crmTelephonyConfig.create({
      data: {
        provider: dto.provider,
        name: dto.name,
        accountSid: dto.accountSid,
        authToken: dto.authToken,
        apiKey: dto.apiKey,
        apiToken: dto.apiToken,
        subdomain: dto.subdomain,
        sipDomain: dto.sipDomain,
        fromNumbers: uniqueNumbers,
        applicationSid: dto.applicationSid,
        isActive: true,
      },
    });

    this.logger.log(`[CrmTelephony] Successfully activated carrier: ${saved.provider} (${saved.id})`);
    return this.getActiveConfig();
  }

  /**
   * Disconnects the active telephony carrier.
   */
  async disconnectProvider(id: string) {
    const existing = await this.prisma.crmTelephonyConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Telephony configuration ${id} not found.`);
    }

    await this.prisma.crmTelephonyConfig.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`[CrmTelephony] Carrier ${existing.provider} disconnected.`);
    return { success: true, message: `Carrier ${existing.provider} disconnected.` };
  }

  /**
   * Tests carrier connectivity by triggering a live verification call to the admin's number.
   */
  async verifyProvider(dto: VerifyCrmTelephonyDto) {
    const raw = await this.getRawActiveConfig();
    if (!raw) {
      throw new BadRequestException('No active telephony carrier connected in Admin Settings.');
    }

    const providerClient = getVoiceTelephonyProvider(raw.provider, {
      accountSid: raw.accountSid || undefined,
      authToken: raw.authToken || undefined,
      apiKey: raw.apiKey || undefined,
      apiToken: raw.apiToken || undefined,
      subdomain: raw.subdomain || undefined,
      sipDomain: raw.sipDomain || undefined,
    });

    const fromNum = dto.fromNumber || raw.fromNumbers?.[0] || '';
    if (!fromNum) {
      throw new BadRequestException('A registered Caller ID / From number is required for test calling.');
    }

    return providerClient.testCarrierCall(dto.toPhone, fromNum, {
      accountSid: raw.accountSid || undefined,
      authToken: raw.authToken || undefined,
      apiKey: raw.apiKey || undefined,
      apiToken: raw.apiToken || undefined,
      subdomain: raw.subdomain || undefined,
      sipDomain: raw.sipDomain || undefined,
    });
  }

  /**
   * Mints an ephemeral WebRTC access token for an authenticated CRM agent.
   */
  async generateAgentToken(userId: string) {
    const raw = await this.getRawActiveConfig();

    // Check for dev mock mode
    const isMock = process.env.CRM_MOCK_TELEPHONY === 'true';
    if (!raw && !isMock) {
      throw new BadRequestException(
        'Telephony is not configured. Please connect a carrier in Admin Settings.',
      );
    }

    const agentIdentity = `agent_${userId}`;

    if (isMock || !raw) {
      return {
        provider: 'MOCK',
        identity: agentIdentity,
        token: `mock_webrtc_token_${Date.now()}_${userId}`,
        fromNumber: '+15550001234',
      };
    }

    const fromNumber = raw.fromNumbers?.[0] || '';

    switch (raw.provider) {
      case 'TWILIO': {
        const sid = raw.accountSid || '';
        let key = raw.apiKey || '';
        let secret = raw.apiToken || '';
        let appSid = raw.applicationSid || process.env.TWILIO_TWIML_APP_SID || '';

        // Auto-heal / provision dedicated Twilio API Key (SK...) if missing
        if ((!key || !key.startsWith('SK')) && sid && raw.authToken) {
          this.logger.log('[CrmTelephony] Twilio active config missing SK... API Key. Auto-provisioning via Twilio REST API...');
          const keyResult = await this.ensureTwilioApiKey(sid, raw.authToken);
          if (keyResult) {
            key = keyResult.apiKey;
            secret = keyResult.apiSecret;
            await this.prisma.crmTelephonyConfig.update({
              where: { id: raw.id },
              data: {
                apiKey: key,
                apiToken: secret,
              },
            });
            this.logger.log(`[CrmTelephony] Auto-provisioned and persisted Twilio API Key: ${key}`);
          }
        }

        // Auto-heal / provision TwiML App (AP...) if missing
        if (!appSid && sid && raw.authToken) {
          const autoAppSid = await this.ensureTwilioApplication(sid, raw.authToken);
          if (autoAppSid) {
            appSid = autoAppSid;
            await this.prisma.crmTelephonyConfig.update({
              where: { id: raw.id },
              data: { applicationSid: autoAppSid },
            });
            this.logger.log(`[CrmTelephony] Auto-provisioned and persisted Twilio TwiML App: ${autoAppSid}`);
          }
        }

        if (!key || !key.startsWith('SK')) {
          throw new BadRequestException(
            'Twilio Voice SDK requires a valid API Key SID (starts with SK). Please verify Twilio credentials or create an API Key in Twilio Console.',
          );
        }

        const token = this.mintTwilioAccessToken({
          accountSid: sid,
          apiKey: key,
          apiSecret: secret,
          identity: agentIdentity,
          outgoingApplicationSid: appSid,
          ttlSeconds: 3600,
        });

        return {
          provider: 'TWILIO',
          identity: agentIdentity,
          token,
          fromNumber,
        };
      }

      case 'TELNYX': {
        return {
          provider: 'TELNYX',
          identity: agentIdentity,
          token: raw.apiKey,
          connectionId: raw.applicationSid,
          fromNumber,
        };
      }

      case 'EXOTEL':
      case 'VOBIZ': {
        const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
        const wsUrl = publicUrl ? publicUrl.replace(/^http/i, 'ws') + '/voice/stream' : 'ws://localhost:3001/voice/stream';

        return {
          provider: raw.provider,
          identity: agentIdentity,
          wsUrl,
          fromNumber,
        };
      }

      default:
        throw new BadRequestException(`Unsupported carrier WebRTC provider: ${raw.provider}`);
    }
  }

  /**
   * Initiates an outbound in-browser softphone call to a lead.
   * Creates an initial CallRecord in database and marks the agent isOnCall: true.
   */
  async initiateCall(userId: string, dto: InitiateCrmCallDto) {
    const raw = await this.getRawActiveConfig();
    const isMock = process.env.CRM_MOCK_TELEPHONY === 'true';

    if (!raw && !isMock) {
      throw new BadRequestException(
        'Cannot initiate call: No active telephony carrier is connected in Admin Settings.',
      );
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${dto.leadId} not found.`);
    }

    const cleanPhone = dto.phone.replace(/[^\d+]/g, '');
    const provider = raw?.provider || ('TWILIO' as VoiceTelephonyType);
    const fromNumber = raw?.fromNumbers?.[0] || '+15550001234';

    // 1. Create CallRecord in database
    const callRecord = await this.prisma.callRecord.create({
      data: {
        leadId: lead.id,
        brokerId: dto.brokerId || undefined,
        userId,
        phoneNumber: cleanPhone,
        direction: 'OUTBOUND',
        status: 'CONNECTED',
        startedAt: new Date(),
        provider,
      },
    });

    // 2. Mark agent on-call
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnCall: true },
    });

    // 3. Mint WebRTC token for this agent
    const tokenData = await this.generateAgentToken(userId);

    // 4. Retrieve agent details to connect their phone for PSTN bridge carriers
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const agentPhone = user?.phoneNumber || fromNumber;
    const publicUrl = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');

    // 5. Dispatch live call depending on active carrier
    if (raw && !isMock) {
      if (raw.provider === 'EXOTEL') {
        const key = raw.apiKey || raw.accountSid;
        const token = raw.apiToken || raw.authToken;
        const sid = raw.accountSid || raw.apiKey;
        const domain = raw.subdomain || 'api.exotel.com';
        const cleanCallerId = this.formatExotelNumber(fromNumber);
        const cleanToPhone = this.formatExotelNumber(cleanPhone);
        const cleanAgentPhone = this.formatExotelNumber(agentPhone);

        const statusCallback = publicUrl
          ? `${publicUrl}/api/crm/telephony/webhooks/exotel-status?callRecordId=${encodeURIComponent(callRecord.id)}`
          : '';

        try {
          const authHeader = Buffer.from(`${key}:${token}`).toString('base64');
          const body = new URLSearchParams({
            From: cleanAgentPhone,
            To: cleanToPhone,
            CallerId: cleanCallerId,
            CallType: 'trans',
            TimeLimit: '600',
            TimeOut: '30',
            ...(statusCallback ? { StatusCallback: statusCallback } : {}),
          });

          const res = await fetch(`https://${domain}/v1/Accounts/${sid}/Calls/connect.json`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });

          const data = (await res.json().catch(() => ({}))) as any;
          const providerCallId = data?.Call?.Sid || data?.sid || `exo_${Date.now()}`;
          await this.prisma.callRecord.update({
            where: { id: callRecord.id },
            data: { providerCallId },
          });

          this.logger.log(`[CrmTelephony] Exotel bridge dispatched (CallSid: ${providerCallId})`);

          return {
            callRecordId: callRecord.id,
            leadId: lead.id,
            leadName: lead.firstName + ' ' + lead.lastName,
            toPhone: cleanPhone,
            fromNumber,
            provider: 'EXOTEL',
            bridgeType: 'PSTN_BRIDGE',
            agentPhone: cleanAgentPhone,
            providerCallId,
            tokenData,
          };
        } catch (err: any) {
          this.logger.error(`[CrmTelephony] Exotel call failed: ${err.message}`);
        }
      } else if (raw.provider === 'VOBIZ') {
        const id = raw.apiKey || raw.accountSid;
        const token = raw.apiToken || raw.authToken;
        const answerUrl = `${publicUrl}/api/crm/telephony/webhooks/vobiz-answer?callRecordId=${encodeURIComponent(callRecord.id)}&agentPhone=${encodeURIComponent(agentPhone)}`;

        try {
          const res = await fetch(`https://api.vobiz.ai/api/v1/Account/${id}/Call/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-ID': id || '',
              'X-Auth-Token': token || '',
              Authorization: `Basic ${Buffer.from(`${id}:${token}`).toString('base64')}`,
            },
            body: JSON.stringify({
              to: cleanPhone,
              from: fromNumber,
              answer_url: answerUrl,
              answer_method: 'GET',
            }),
          });

          const data = (await res.json().catch(() => ({}))) as any;
          const providerCallId = data.callId || data.call_uuid || data.id || `vob_${Date.now()}`;
          await this.prisma.callRecord.update({
            where: { id: callRecord.id },
            data: { providerCallId },
          });

          this.logger.log(`[CrmTelephony] Vobiz call dispatched (CallId: ${providerCallId})`);

          return {
            callRecordId: callRecord.id,
            leadId: lead.id,
            leadName: lead.firstName + ' ' + lead.lastName,
            toPhone: cleanPhone,
            fromNumber,
            provider: 'VOBIZ',
            bridgeType: 'PSTN_BRIDGE',
            agentPhone,
            providerCallId,
            tokenData,
          };
        } catch (err: any) {
          this.logger.error(`[CrmTelephony] Vobiz call failed: ${err.message}`);
        }
      } else if (raw.provider === 'TELNYX') {
        const key = raw.apiKey || raw.apiToken || raw.authToken;
        const cleanTo = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
        const cleanFrom = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`;
        const answerUrl = `${publicUrl}/api/crm/telephony/webhooks/telnyx-voice?callRecordId=${encodeURIComponent(callRecord.id)}&agentPhone=${encodeURIComponent(agentPhone)}`;

        try {
          const res = await fetch('https://api.telnyx.com/v2/texml/calls', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              To: cleanTo,
              From: cleanFrom,
              Url: answerUrl,
            }),
          });

          const data = (await res.json().catch(() => ({}))) as any;
          const providerCallId = data.call_sid || data.data?.call_control_id || `teln_${Date.now()}`;
          await this.prisma.callRecord.update({
            where: { id: callRecord.id },
            data: { providerCallId },
          });

          this.logger.log(`[CrmTelephony] Telnyx TeXML call dispatched (CallSid: ${providerCallId})`);

          return {
            callRecordId: callRecord.id,
            leadId: lead.id,
            leadName: lead.firstName + ' ' + lead.lastName,
            toPhone: cleanPhone,
            fromNumber,
            provider: 'TELNYX',
            bridgeType: 'PSTN_BRIDGE',
            agentPhone,
            providerCallId,
            tokenData,
          };
        } catch (err: any) {
          this.logger.error(`[CrmTelephony] Telnyx call failed: ${err.message}`);
        }
      }
    }

    this.logger.log(`[CrmTelephony] Call initiated for Lead ${lead.id} by Agent ${userId} (CallRecord: ${callRecord.id})`);

    return {
      callRecordId: callRecord.id,
      leadId: lead.id,
      leadName: lead.firstName + ' ' + lead.lastName,
      toPhone: cleanPhone,
      fromNumber,
      provider,
      bridgeType: provider === 'TWILIO' ? 'WEBRTC' : 'MOCK',
      tokenData,
    };
  }

  /**
   * Ends an active call session and resets user on-call status.
   */
  async hangupCall(userId: string, callRecordId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnCall: false },
    });

    const record = await this.prisma.callRecord.findUnique({
      where: { id: callRecordId },
    });

    if (record && !record.endedAt) {
      const now = new Date();
      const durationSeconds = Math.max(1, Math.round((now.getTime() - record.startedAt.getTime()) / 1000));
      await this.prisma.callRecord.update({
        where: { id: callRecordId },
        data: {
          endedAt: now,
          duration: durationSeconds,
        },
      });
    }

    this.logger.log(`[CrmTelephony] Call ended: ${callRecordId} by Agent ${userId}`);
    return { success: true };
  }

  /**
   * Helper: Mints Twilio Access Token with VoiceGrant using native Node.js crypto.
   */
  private mintTwilioAccessToken(options: {
    accountSid: string;
    apiKey: string;
    apiSecret: string;
    identity: string;
    outgoingApplicationSid?: string;
    ttlSeconds?: number;
  }): string {
    const header = {
      typ: 'JWT',
      alg: 'HS256',
      cty: 'twilio-fpa;v=1',
    };

    const now = Math.floor(Date.now() / 1000);
    const ttl = options.ttlSeconds || 3600;

    const payload: any = {
      jti: `${options.apiKey}-${now}`,
      iss: options.apiKey,
      sub: options.accountSid,
      nbf: now,
      exp: now + ttl,
      grants: {
        identity: options.identity,
        voice: {
          incoming: { allow: true },
          outgoing: options.outgoingApplicationSid
            ? { application_sid: options.outgoingApplicationSid }
            : {},
        },
      },
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', options.apiSecret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  /**
   * Helper: Programmatically provisions a dedicated Twilio API Key (SK...)
   * required by Twilio Voice WebRTC SDK v2.
   */
  async ensureTwilioApiKey(
    accountSid: string,
    authToken: string,
  ): Promise<{ apiKey: string; apiSecret: string } | null> {
    try {
      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const body = new URLSearchParams({ FriendlyName: 'BrokerOS_CRM_WebRTC_Voice' });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        this.logger.warn(`[CrmTelephony] Twilio Keys API returned HTTP ${res.status}: ${errorText}`);
        return null;
      }

      const data = (await res.json()) as any;
      if (data?.sid?.startsWith('SK') && data?.secret) {
        this.logger.log(`[CrmTelephony] Successfully auto-provisioned Twilio API Key: ${data.sid}`);
        return { apiKey: data.sid, apiSecret: data.secret };
      }
      return null;
    } catch (err: any) {
      this.logger.error(`[CrmTelephony] Failed to provision Twilio API Key: ${err.message}`);
      return null;
    }
  }

  /**
   * Helper: Programmatically provisions a dedicated TwiML Voice Application (AP...)
   * required to route outbound WebRTC calls.
   */
  async ensureTwilioApplication(
    accountSid: string,
    authToken: string,
    publicUrl?: string,
  ): Promise<string | null> {
    try {
      const basePublicUrl = (publicUrl || process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
      const voiceUrl = basePublicUrl
        ? `${basePublicUrl}/api/crm/telephony/webhooks/twilio-voice`
        : 'http://localhost:3333/api/crm/telephony/webhooks/twilio-voice';
      const statusUrl = basePublicUrl
        ? `${basePublicUrl}/api/crm/telephony/webhooks/twilio-status`
        : 'http://localhost:3333/api/crm/telephony/webhooks/twilio-status';

      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const body = new URLSearchParams({
        FriendlyName: 'BrokerOS CRM Outbound Voice App',
        VoiceUrl: voiceUrl,
        VoiceMethod: 'POST',
        StatusCallback: statusUrl,
        StatusCallbackMethod: 'POST',
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        this.logger.warn(`[CrmTelephony] Twilio Applications API returned HTTP ${res.status}: ${errorText}`);
        return null;
      }

      const data = (await res.json()) as any;
      if (data?.sid?.startsWith('AP')) {
        this.logger.log(`[CrmTelephony] Successfully auto-provisioned Twilio TwiML App: ${data.sid}`);
        return data.sid;
      }
      return null;
    } catch (err: any) {
      this.logger.error(`[CrmTelephony] Failed to provision Twilio TwiML App: ${err.message}`);
      return null;
    }
  }

  /**
   * Helper: Formats phone numbers for Exotel API.
   */
  private formatExotelNumber(raw: string): string {
    if (!raw) return '';
    let cleaned = raw.replace(/[^\d]/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '0' + cleaned.slice(2);
    } else if (cleaned.length === 10) {
      cleaned = '0' + cleaned;
    }
    return cleaned;
  }

  /**
   * Mask sensitive API key or token for UI safety.
   */
  private maskKey(val: string): string {
    if (!val || val.length < 8) return '••••••••';
    return val.substring(0, 4) + '••••••••' + val.substring(val.length - 4);
  }
}
