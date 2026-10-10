jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { VoiceMediaStreamGateway } from './voice-media-stream.gateway.js';

describe('VoiceMediaStreamGateway', () => {
  let gateway: VoiceMediaStreamGateway;
  let mockAudioService: any;
  let mockClient: any;

  beforeEach(() => {
    mockAudioService = {
      previewTtsAudio: jest.fn().mockResolvedValue({
        audioBuffer: Buffer.alloc(320),
        contentType: 'audio/wav',
      }),
    };

    mockClient = {
      id: 'socket-client-1',
      emit: jest.fn(),
    };

    gateway = new VoiceMediaStreamGateway(mockAudioService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle connection and disconnection', () => {
    gateway.handleConnection(mockClient);
    expect(gateway.getActiveSessionsCount()).toBe(0);

    gateway.handleDisconnect(mockClient);
    expect(gateway.getActiveSessionsCount()).toBe(0);
  });

  it('should start session, synthesize first message, and stream audio chunks', async () => {
    const data = {
      streamSid: 'stream-123',
      callSid: 'call-123',
      customParameters: {
        firstMessage: 'Welcome to BrokerOS',
        voiceId: 'rahul',
      },
    };

    const res = await gateway.handleStreamStart(mockClient, data);

    expect(res.event).toBe('started');
    expect(res.streamSid).toBe('stream-123');
    expect(mockAudioService.previewTtsAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Welcome to BrokerOS',
      }),
    );
    expect(mockClient.emit).toHaveBeenCalledWith(
      'media',
      expect.objectContaining({
        event: 'media',
        streamSid: 'stream-123',
      }),
    );
    expect(gateway.getActiveSessionsCount()).toBe(1);
  });

  it('should record media chunk and handle stream stop', () => {
    gateway.handleMediaChunk(mockClient, { streamSid: 'stream-123' });

    const stopRes = gateway.handleStreamStop(mockClient, {
      streamSid: 'stream-123',
    });
    expect(stopRes.event).toBe('stopped');
    expect(gateway.getActiveSessionsCount()).toBe(0);
  });
});
