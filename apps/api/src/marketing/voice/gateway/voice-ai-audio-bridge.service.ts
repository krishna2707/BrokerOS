// ============================================================================
// BrokerOS — Voice AI Audio Bridge Service (Realtime Bi-directional Streaming)
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { WebSocket as WsClient } from 'ws';
import { prismaClient } from '@brokeros/prisma';
import type { TelephonyStreamSession } from '@brokeros/types';
import { VoiceAudioTranscoder } from './voice-audio-transcoder.js';
import { VoiceAudioService } from '../services/voice-audio.service.js';

interface ActiveAiConnection {
  streamSid: string;
  platform: string;
  ws?: WsClient;
  isConnected: boolean;
  sendToTelephony: (payloadBase64: string) => void;
  clearTelephony: () => void;
  audioBuffer: Buffer[];
  bufferLength: number;
}

@Injectable()
export class VoiceAiAudioBridgeService {
  private readonly logger = new Logger(VoiceAiAudioBridgeService.name);
  private readonly prisma = prismaClient;
  private readonly activeConnections = new Map<string, ActiveAiConnection>();

  constructor(private readonly audioService?: VoiceAudioService) {}

  /**
   * Initializes a bi-directional AI session when a telephony carrier starts a media stream.
   */
  async handleSessionStart(
    session: TelephonyStreamSession,
    sendToTelephony: (payloadBase64: string) => void,
    clearTelephony: () => void,
  ): Promise<void> {
    const streamSid = session.streamSid;
    const platform = (session.agentPlatform || 'OPENAI_REALTIME').toUpperCase();

    this.logger.log(
      `[VoiceAiBridge] Initializing AI session for stream ${streamSid} on platform ${platform}`,
    );

    const activeConn: ActiveAiConnection = {
      streamSid,
      platform,
      isConnected: false,
      sendToTelephony,
      clearTelephony,
      audioBuffer: [],
      bufferLength: 0,
    };
    this.activeConnections.set(streamSid, activeConn);

    try {
      if (platform === 'OPENAI_REALTIME') {
        await this.initOpenAiRealtime(session, activeConn);
      } else if (platform === 'ELEVENLABS') {
        await this.initElevenLabsRealtime(session, activeConn);
      } else if (platform === 'SARVAM') {
        await this.initSarvamRealtime(session, activeConn);
      } else {
        // Fallback or generic agent: speak first message
        await this.speakInitialGreeting(session, sendToTelephony);
      }
    } catch (err: any) {
      this.logger.error(
        `[VoiceAiBridge] Failed to initialize AI session for ${streamSid}: ${err?.message}`,
      );
      // Fallback: speak initial greeting so the caller isn't left in silence
      await this.speakInitialGreeting(session, sendToTelephony);
    }
  }

  /**
   * Forwards inbound caller audio packets from the telephony stream to the active AI session.
   */
  handleInboundAudioChunk(streamSid: string, payloadBase64: string): void {
    const conn = this.activeConnections.get(streamSid);
    if (!conn) return;

    if (conn.platform === 'OPENAI_REALTIME' && conn.ws && conn.isConnected) {
      if (conn.ws.readyState === WsClient.OPEN) {
        conn.ws.send(
          JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: payloadBase64,
          }),
        );
      }
    } else if (conn.platform === 'ELEVENLABS' && conn.ws && conn.isConnected) {
      if (conn.ws.readyState === WsClient.OPEN) {
        // Convert μ-law to 16kHz PCM for ElevenLabs
        const pcm8k = VoiceAudioTranscoder.base64UlawToPcm16(payloadBase64);
        conn.ws.send(
          JSON.stringify({
            user_audio_chunk: pcm8k.toString('base64'),
          }),
        );
      }
    } else if (conn.platform === 'SARVAM') {
      // Buffer caller audio for turn-based processing
      const rawChunk = Buffer.from(payloadBase64, 'base64');
      conn.audioBuffer.push(rawChunk);
      conn.bufferLength += rawChunk.length;
    }
  }

  /**
   * Cleans up resources when the telephony stream disconnects.
   */
  handleSessionEnd(streamSid: string): void {
    const conn = this.activeConnections.get(streamSid);
    if (conn) {
      if (conn.ws && conn.ws.readyState === WsClient.OPEN) {
        try {
          conn.ws.close();
        } catch {}
      }
      this.activeConnections.delete(streamSid);
      this.logger.log(`[VoiceAiBridge] Cleaned up AI session for stream ${streamSid}`);
    }
  }

  // ── 1. OpenAI Realtime Bridge ──
  private async initOpenAiRealtime(
    session: TelephonyStreamSession,
    conn: ActiveAiConnection,
  ): Promise<void> {
    let apiKey = session.apiKey || process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      const integration = await this.prisma.voiceAgentIntegration.findFirst({
        where: { platform: 'OPENAI_REALTIME', isActive: true },
        orderBy: { isDefault: 'desc' },
      });
      if (integration?.apiKey) apiKey = integration.apiKey;
    }

    if (!apiKey) {
      this.logger.warn(`[OpenAIRealtime] No OpenAI API key configured. Speaking fallback greeting.`);
      await this.speakInitialGreeting(session, conn.sendToTelephony);
      return;
    }

    const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview';
    const ws = new WsClient(wsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });
    conn.ws = ws;

    ws.on('open', () => {
      conn.isConnected = true;
      this.logger.log(`[OpenAIRealtime] Connected to OpenAI Realtime for stream ${conn.streamSid}`);

      // Configure session with native G.711 μ-law
      ws.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['audio', 'text'],
            instructions:
              session.scriptPrompt ||
              'You are a professional real estate sales advisor. Keep answers concise, natural, and friendly for phone calls.',
            voice: session.voiceId || 'alloy',
            input_audio_format: 'g711_ulaw',
            output_audio_format: 'g711_ulaw',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
            },
          },
        }),
      );

      // Trigger initial speaking greeting
      const greetingPrompt =
        session.firstMessage ||
        'Hello! Thank you for connecting with us. How can I help you with your property requirements today?';

      ws.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Greet the user now by speaking the following exact initial message: "${greetingPrompt}"`,
              },
            ],
          },
        }),
      );

      ws.send(JSON.stringify({ type: 'response.create' }));
    });

    ws.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'response.audio.delta' && msg.delta) {
          // Stream raw μ-law chunk directly to the telephony carrier
          conn.sendToTelephony(msg.delta);
        } else if (msg.type === 'input_audio_buffer.speech_started') {
          // Barge-in detected: clear carrier audio buffer so AI stops speaking
          this.logger.log(`[OpenAIRealtime] Caller barge-in detected on stream ${conn.streamSid}`);
          conn.clearTelephony();
        } else if (msg.type === 'error') {
          this.logger.error(`[OpenAIRealtime] Error from OpenAI: ${JSON.stringify(msg.error)}`);
        }
      } catch (err: any) {
        this.logger.warn(`[OpenAIRealtime] Failed to parse message: ${err?.message}`);
      }
    });

    ws.on('error', (err) => {
      this.logger.error(`[OpenAIRealtime] WebSocket error on stream ${conn.streamSid}: ${err.message}`);
    });

    ws.on('close', (code, reason) => {
      conn.isConnected = false;
      this.logger.log(
        `[OpenAIRealtime] WebSocket closed on stream ${conn.streamSid} (${code}: ${reason.toString()})`,
      );
    });
  }

  // ── 2. ElevenLabs Conversational AI Bridge ──
  private async initElevenLabsRealtime(
    session: TelephonyStreamSession,
    conn: ActiveAiConnection,
  ): Promise<void> {
    let apiKey = session.apiKey || process.env.ELEVENLABS_API_KEY || '';
    if (!apiKey) {
      const integration = await this.prisma.voiceAgentIntegration.findFirst({
        where: { platform: 'ELEVENLABS', isActive: true },
        orderBy: { isDefault: 'desc' },
      });
      if (integration?.apiKey) apiKey = integration.apiKey;
    }

    const agentId = session.voiceId?.length > 15 ? session.voiceId : process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      this.logger.warn(`[ElevenLabs] Missing API key or Agent ID. Speaking fallback greeting.`);
      await this.speakInitialGreeting(session, conn.sendToTelephony);
      return;
    }

    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
    const ws = new WsClient(wsUrl, {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    conn.ws = ws;

    ws.on('open', () => {
      conn.isConnected = true;
      this.logger.log(`[ElevenLabs] Connected to ConvAI for stream ${conn.streamSid}`);
    });

    ws.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio_event?.audio_base_64) {
          // Transcode 16kHz PCM from ElevenLabs to 8kHz μ-law for telephony
          const rawPcm = Buffer.from(msg.audio_event.audio_base_64, 'base64');
          const ulawBase64 = VoiceAudioTranscoder.pcm16ToBase64Ulaw(rawPcm);
          conn.sendToTelephony(ulawBase64);
        } else if (msg.interruption_event) {
          conn.clearTelephony();
        }
      } catch (err: any) {
        this.logger.warn(`[ElevenLabs] Parse error: ${err?.message}`);
      }
    });

    ws.on('error', (err) => {
      this.logger.error(`[ElevenLabs] WebSocket error: ${err.message}`);
    });

    ws.on('close', () => {
      conn.isConnected = false;
    });
  }

  // ── 3. Sarvam AI Indic Voice Bridge ──
  private async initSarvamRealtime(
    session: TelephonyStreamSession,
    conn: ActiveAiConnection,
  ): Promise<void> {
    this.logger.log(`[Sarvam] Initiating Indic speech session on stream ${conn.streamSid}`);
    // Speak the customized first message synthesized via Sarvam Bulbul TTS
    await this.speakInitialGreeting(session, conn.sendToTelephony, 'sarvam');
  }

  // ── Helper: Synthesize & stream audio message to carrier ──
  private async speakInitialGreeting(
    session: TelephonyStreamSession,
    sendToTelephony: (payloadBase64: string) => void,
    preferredProvider?: string,
  ): Promise<void> {
    if (!this.audioService || !session.firstMessage) return;

    try {
      const audio = await this.audioService.previewTtsAudio({
        text: session.firstMessage,
        voiceId: session.voiceId || 'alloy',
        voiceProvider: preferredProvider || session.voiceProvider || 'openai',
      });

      if (audio?.audioBuffer && audio.audioBuffer.length > 0) {
        const ulawBase64 = VoiceAudioTranscoder.pcm16ToBase64Ulaw(audio.audioBuffer);
        const chunkSize = 160; // 20ms chunks of 8kHz μ-law
        for (let offset = 0; offset < ulawBase64.length; offset += chunkSize) {
          const chunk = ulawBase64.substring(offset, offset + chunkSize);
          sendToTelephony(chunk);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `[VoiceAiBridge] Could not synthesize initial greeting for ${session.streamSid}: ${err?.message}`,
      );
    }
  }
}
