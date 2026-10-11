// ============================================================================
// BrokerOS — Voice Telephony Raw RFC 6455 WebSocket Gateway
// Optimized for Twilio, Telnyx, and Vobiz bi-directional media streams
// ============================================================================

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WebSocketServer as WsServer, WebSocket as WsClient } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import { StreamSessionManager } from './voice-stream-session.js';
import { VoiceAiAudioBridgeService } from './voice-ai-audio-bridge.service.js';

@Injectable()
export class VoiceRawMediaGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VoiceRawMediaGateway.name);
  private wsServer?: WsServer;
  private readonly clientSockets = new Map<string, WsClient>();
  private readonly streamSocketMap = new Map<string, WsClient>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly sessionManager: StreamSessionManager,
    private readonly aiBridge: VoiceAiAudioBridgeService,
  ) {}

  onModuleInit() {
    this.initRawWebSocketServer();
  }

  onModuleDestroy() {
    this.closeRawWebSocketServer();
  }

  private initRawWebSocketServer() {
    try {
      const httpAdapter = this.httpAdapterHost?.httpAdapter;
      if (!httpAdapter) {
        this.logger.warn('HttpAdapter not available. Raw WebSocket server will not attach.');
        return;
      }

      const httpServer = httpAdapter.getHttpServer();
      if (!httpServer) {
        this.logger.warn('HttpServer not available. Raw WebSocket server will not attach.');
        return;
      }

      this.wsServer = new WsServer({ noServer: true });

      httpServer.on(
        'upgrade',
        (request: IncomingMessage, socket: NetSocket, head: Buffer) => {
          const urlString = request.url || '';
          let pathname = '';
          try {
            pathname = new URL(urlString, 'http://localhost').pathname;
          } catch {
            pathname = urlString.split('?')[0];
          }

          // Intercept /voice/stream and /voice/stream/raw for Telephony Media Streams
          if (
            pathname === '/voice/stream' ||
            pathname === '/voice/stream/raw' ||
            pathname.startsWith('/voice/stream/')
          ) {
            this.wsServer?.handleUpgrade(request, socket, head, (ws: WsClient) => {
              this.wsServer?.emit('connection', ws, request);
            });
          }
        },
      );

      this.wsServer.on('connection', (ws: WsClient, req: IncomingMessage) => {
        const socketId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.clientSockets.set(socketId, ws);
        let activeStreamSid: string | null = null;

        this.logger.log(`[RawMediaGateway] Telephony stream carrier connected: ${socketId} (URL: ${req.url})`);

        ws.on('message', async (data: any) => {
          try {
            const rawText = data.toString();
            const msg = JSON.parse(rawText);
            const event = msg.event;

            if (event === 'start') {
              const streamSid = msg.streamSid || msg.start?.streamSid || `stream_${Date.now()}`;
              const callSid = msg.start?.callSid || msg.callSid || `call_${Date.now()}`;
              const customParams = msg.start?.customParameters || msg.customParameters || {};

              activeStreamSid = streamSid;
              this.streamSocketMap.set(streamSid, ws);

              const session = this.sessionManager.startSession(
                streamSid,
                callSid,
                socketId,
                customParams,
              );

              // Connect to the real-time AI audio pipeline
              await this.aiBridge.handleSessionStart(
                session,
                (payloadBase64: string) => {
                  this.sendAudioChunk(streamSid, payloadBase64);
                },
                () => {
                  this.clearAudioBuffer(streamSid);
                },
              );
            } else if (event === 'media') {
              const streamSid = msg.streamSid || activeStreamSid;
              const payload = msg.media?.payload;
              if (streamSid && payload) {
                this.sessionManager.recordPacketReceived(streamSid);
                this.aiBridge.handleInboundAudioChunk(streamSid, payload);
              }
            } else if (event === 'stop') {
              const streamSid = msg.streamSid || activeStreamSid;
              if (streamSid) {
                this.sessionManager.endSession(streamSid);
                this.aiBridge.handleSessionEnd(streamSid);
                this.streamSocketMap.delete(streamSid);
              }
            }
          } catch (err: any) {
            this.logger.warn(`[RawMediaGateway] Failed to parse telephony frame: ${err?.message}`);
          }
        });

        ws.on('error', (err) => {
          this.logger.error(`[RawMediaGateway] Telephony socket error on ${socketId}: ${err.message}`);
        });

        ws.on('close', () => {
          this.logger.log(`[RawMediaGateway] Telephony stream carrier disconnected: ${socketId}`);
          this.clientSockets.delete(socketId);
          if (activeStreamSid) {
            this.sessionManager.endSession(activeStreamSid);
            this.aiBridge.handleSessionEnd(activeStreamSid);
            this.streamSocketMap.delete(activeStreamSid);
          }
        });
      });

      this.logger.log('[RawMediaGateway] Raw RFC 6455 WebSocket Gateway attached to /voice/stream');
    } catch (err: any) {
      this.logger.error(`[RawMediaGateway] Failed to initialize WebSocket server: ${err?.message}`);
    }
  }

  private closeRawWebSocketServer() {
    if (this.wsServer) {
      try {
        this.wsServer.close();
      } catch {}
      this.wsServer = undefined;
    }
    this.clientSockets.clear();
    this.streamSocketMap.clear();
  }

  /**
   * Transmits a synthesized μ-law audio payload chunk back to the telephony carrier.
   */
  sendAudioChunk(streamSid: string, payloadBase64: string): boolean {
    const ws = this.streamSocketMap.get(streamSid);
    if (!ws || ws.readyState !== WsClient.OPEN) return false;

    try {
      ws.send(
        JSON.stringify({
          event: 'media',
          streamSid,
          media: {
            payload: payloadBase64,
          },
        }),
      );
      this.sessionManager.recordPacketSent(streamSid);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sends clear signal to the telephony carrier when caller barge-in occurs.
   */
  clearAudioBuffer(streamSid: string): boolean {
    const ws = this.streamSocketMap.get(streamSid);
    if (!ws || ws.readyState !== WsClient.OPEN) return false;

    try {
      ws.send(
        JSON.stringify({
          event: 'clear',
          streamSid,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
