jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppRealtimeGateway } from './whatsapp-realtime.gateway.js';
import { WA_EVENTS } from '@brokeros/constants';

describe('WhatsAppRealtimeGateway', () => {
  let gateway: WhatsAppRealtimeGateway;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppRealtimeGateway],
    }).compile();

    gateway = module.get<WhatsAppRealtimeGateway>(WhatsAppRealtimeGateway);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = mockServer;

    mockSocket = {
      id: 'socket-123',
      handshake: {
        query: {},
      },
      join: jest.fn(),
      leave: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should join conversation and account rooms if provided in query', () => {
      mockSocket.handshake.query = {
        conversationId: 'conv-1',
        accountId: 'acc-1',
      };

      gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('conv:conv-1');
      expect(mockSocket.join).toHaveBeenCalledWith('acc:acc-1');
    });

    it('should not join rooms if query parameters are missing', () => {
      mockSocket.handshake.query = {};

      gateway.handleConnection(mockSocket);

      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection without throwing', () => {
      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('handleJoinConversation', () => {
    it('should join conversation room when conversationId is provided', () => {
      gateway.handleJoinConversation(mockSocket, { conversationId: 'conv-2' });
      expect(mockSocket.join).toHaveBeenCalledWith('conv:conv-2');
    });

    it('should do nothing if conversationId is missing', () => {
      gateway.handleJoinConversation(mockSocket, {} as any);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveConversation', () => {
    it('should leave conversation room when conversationId is provided', () => {
      gateway.handleLeaveConversation(mockSocket, { conversationId: 'conv-2' });
      expect(mockSocket.leave).toHaveBeenCalledWith('conv:conv-2');
    });
  });

  describe('handleJoinAccount', () => {
    it('should join account room when accountId is provided', () => {
      gateway.handleJoinAccount(mockSocket, { accountId: 'acc-2' });
      expect(mockSocket.join).toHaveBeenCalledWith('acc:acc-2');
    });
  });

  describe('emitMessageReceived', () => {
    it('should emit to conversation room and optionally to account room', () => {
      const msg = { id: 'm-1', text: 'Hello' };
      gateway.emitMessageReceived('conv-1', msg, 'acc-1');

      expect(mockServer.to).toHaveBeenCalledWith('conv:conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith(WA_EVENTS.MESSAGE_RECEIVED, msg);

      expect(mockServer.to).toHaveBeenCalledWith('acc:acc-1');
      expect(mockServer.emit).toHaveBeenCalledWith(WA_EVENTS.MESSAGE_RECEIVED, msg);
    });

    it('should do nothing if server is not initialized', () => {
      (gateway as any).server = null;
      expect(() => gateway.emitMessageReceived('conv-1', {})).not.toThrow();
    });
  });

  describe('emitMessageSent', () => {
    it('should emit message sent event to conv and acc rooms', () => {
      const msg = { id: 'm-2', text: 'Outbound' };
      gateway.emitMessageSent('conv-1', msg, 'acc-1');

      expect(mockServer.to).toHaveBeenCalledWith('conv:conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith(WA_EVENTS.MESSAGE_SENT, msg);
      expect(mockServer.to).toHaveBeenCalledWith('acc:acc-1');
    });
  });

  describe('emitMessageStatus', () => {
    it('should emit message status event with payload', () => {
      gateway.emitMessageStatus('conv-1', 'm-1', 'delivered', 'acc-1');

      const expectedPayload = {
        messageId: 'm-1',
        status: 'delivered',
        conversationId: 'conv-1',
      };
      expect(mockServer.to).toHaveBeenCalledWith('conv:conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        WA_EVENTS.MESSAGE_STATUS,
        expectedPayload,
      );
      expect(mockServer.to).toHaveBeenCalledWith('acc:acc-1');
    });
  });

  describe('emitConversationUpdated', () => {
    it('should emit conversation updated to account room', () => {
      const conv = { id: 'conv-1', unreadCount: 0 };
      gateway.emitConversationUpdated('acc-1', conv);

      expect(mockServer.to).toHaveBeenCalledWith('acc:acc-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        WA_EVENTS.CONVERSATION_UPDATED,
        conv,
      );
    });
  });
});
