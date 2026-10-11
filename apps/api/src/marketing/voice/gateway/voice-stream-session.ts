// ============================================================================
// BrokerOS — Voice Media Streaming Session Manager
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import type { TelephonyStreamSession } from '@brokeros/types';

@Injectable()
export class StreamSessionManager {
  private readonly logger = new Logger(StreamSessionManager.name);
  private readonly sessions = new Map<string, TelephonyStreamSession>();

  startSession(
    streamSid: string,
    callSid: string,
    socketId: string,
    customParams: Record<string, any> = {},
  ): TelephonyStreamSession {
    const session: TelephonyStreamSession = {
      streamSid,
      callSid,
      campaignId: customParams.campaignId,
      recipientId: customParams.recipientId,
      agentPlatform: (customParams.agentPlatform || customParams.agent || 'OPENAI_REALTIME').toUpperCase(),
      voiceId: customParams.voiceId || customParams.voice || 'alloy',
      voiceProvider: customParams.voiceProvider || 'openai',
      firstMessage:
        customParams.firstMessage ||
        'Hello! Thank you for connecting with us. How may I assist your property search today?',
      scriptPrompt: customParams.scriptPrompt || '',
      socketId,
      startedAt: new Date(),
      audioPacketsReceived: 0,
      audioPacketsSent: 0,
      apiKey: customParams.apiKey,
      variables: customParams.variables,
      isAiReady: false,
    };

    this.sessions.set(streamSid, session);
    this.logger.log(
      `[StreamSessionManager] Started stream session: ${streamSid} (Call: ${callSid}, Agent: ${session.agentPlatform})`,
    );
    return session;
  }

  recordPacketReceived(streamSid: string): void {
    const session = this.sessions.get(streamSid);
    if (session) {
      session.audioPacketsReceived += 1;
    }
  }

  recordPacketSent(streamSid: string): void {
    const session = this.sessions.get(streamSid);
    if (session) {
      session.audioPacketsSent += 1;
    }
  }

  getSession(streamSid: string): TelephonyStreamSession | undefined {
    return this.sessions.get(streamSid);
  }

  endSession(streamSid: string): TelephonyStreamSession | undefined {
    const session = this.sessions.get(streamSid);
    if (session) {
      this.sessions.delete(streamSid);
      const durationSec = (
        (Date.now() - session.startedAt.getTime()) /
        1000
      ).toFixed(1);
      this.logger.log(
        `[StreamSessionManager] Ended stream session: ${streamSid} (Duration: ${durationSec}s, Packets In: ${session.audioPacketsReceived}, Packets Out: ${session.audioPacketsSent})`,
      );
    }
    return session;
  }

  endSessionBySocket(socketId: string): TelephonyStreamSession | undefined {
    for (const [streamSid, session] of this.sessions.entries()) {
      if (session.socketId === socketId) {
        this.sessions.delete(streamSid);
        const durationSec = (
          (Date.now() - session.startedAt.getTime()) /
          1000
        ).toFixed(1);
        this.logger.log(
          `[StreamSessionManager] Socket disconnected, cleaned stream session: ${streamSid} (Duration: ${durationSec}s)`,
        );
        return session;
      }
    }
    return undefined;
  }

  getActiveCount(): number {
    return this.sessions.size;
  }
}
