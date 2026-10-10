import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://blob.vercel.com/chat/file.png',
  }),
}));

import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { put } from '@vercel/blob';

describe('ChatController', () => {
  let controller: ChatController;
  let service: {
    getValidContacts: jest.Mock;
    getChatRooms: jest.Mock;
    getOrCreateDirectRoom: jest.Mock;
    getMessages: jest.Mock;
    sendMessage: jest.Mock;
    markAsRead: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getValidContacts: jest.fn(),
      getChatRooms: jest.fn(),
      getOrCreateDirectRoom: jest.fn(),
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: service }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -- GET /api/chat/contacts -------------------------------------------------

  describe('getContacts', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.getContacts({ user: undefined } as any);
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
      expect(service.getValidContacts).not.toHaveBeenCalled();
    });

    it('should return valid contacts for authenticated user', async () => {
      const contacts = [{ id: 'u-2', name: 'Jane' }];
      service.getValidContacts.mockResolvedValue(contacts);

      const res = await controller.getContacts({ user: { id: 'u-1' } } as any);

      expect(service.getValidContacts).toHaveBeenCalledWith('u-1');
      expect(res).toEqual({ success: true, data: contacts });
    });
  });

  // -- POST /api/chat/upload --------------------------------------------------

  describe('uploadFile', () => {
    it('should return null url when no file is provided', async () => {
      const res = await controller.uploadFile(null as any);
      expect(res).toEqual({ success: false, url: null });
    });

    it('should upload file and return blob url', async () => {
      const file = {
        originalname: 'photo.png',
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      const res = await controller.uploadFile(file);

      expect(put).toHaveBeenCalled();
      expect(res).toEqual({
        success: true,
        data: {
          url: 'https://blob.vercel.com/chat/file.png',
          name: 'photo.png',
          type: 'image/png',
        },
      });
    });
  });

  // -- GET /api/chat/rooms ----------------------------------------------------

  describe('getRooms', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.getRooms({ user: undefined } as any);
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('should return rooms for authenticated user', async () => {
      const rooms = [{ id: 'r-1', type: 'DIRECT' }];
      service.getChatRooms.mockResolvedValue(rooms);

      const res = await controller.getRooms({ user: { id: 'u-1' } } as any);

      expect(service.getChatRooms).toHaveBeenCalledWith('u-1');
      expect(res).toEqual({ success: true, data: rooms });
    });
  });

  // -- POST /api/chat/direct/:targetUserId -----------------------------------

  describe('getOrCreateRoom', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.getOrCreateRoom(
        { user: undefined } as any,
        'u-2',
      );
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('should get or create direct room', async () => {
      const room = { id: 'r-1', type: 'DIRECT' };
      service.getOrCreateDirectRoom.mockResolvedValue(room);

      const res = await controller.getOrCreateRoom(
        { user: { id: 'u-1' } } as any,
        'u-2',
      );

      expect(service.getOrCreateDirectRoom).toHaveBeenCalledWith('u-1', 'u-2');
      expect(res).toEqual({ success: true, data: room });
    });
  });

  // -- GET /api/chat/rooms/:roomId/messages ----------------------------------

  describe('getMessages', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.getMessages(
        { user: undefined } as any,
        'r-1',
      );
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('should return messages with default limit', async () => {
      const messages = [{ id: 'msg-1', content: 'hello' }];
      service.getMessages.mockResolvedValue(messages);

      const res = await controller.getMessages(
        { user: { id: 'u-1' } } as any,
        'r-1',
        undefined,
        undefined,
      );

      expect(service.getMessages).toHaveBeenCalledWith('r-1', undefined, 20);
      expect(res).toEqual({ success: true, data: messages });
    });

    it('should pass cursor and parsed limit', async () => {
      service.getMessages.mockResolvedValue([]);

      await controller.getMessages(
        { user: { id: 'u-1' } } as any,
        'r-1',
        'cursor-abc',
        '10',
      );

      expect(service.getMessages).toHaveBeenCalledWith('r-1', 'cursor-abc', 10);
    });
  });

  // -- POST /api/chat/rooms/:roomId/messages ---------------------------------

  describe('sendMessage', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.sendMessage(
        { user: undefined } as any,
        'r-1',
        {},
      );
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('should send a message and return it', async () => {
      const message = { id: 'msg-1', content: 'hi' };
      service.sendMessage.mockResolvedValue(message);

      const body = { content: 'hi', attachment: undefined } as any;
      const res = await controller.sendMessage(
        { user: { id: 'u-1' } } as any,
        'r-1',
        body,
      );

      expect(service.sendMessage).toHaveBeenCalledWith(
        'u-1',
        'r-1',
        'hi',
        undefined,
      );
      expect(res).toEqual({ success: true, data: message });
    });
  });

  // -- POST /api/chat/rooms/:roomId/read -------------------------------------

  describe('markAsRead', () => {
    it('should return unauthorized if user is missing', async () => {
      const res = await controller.markAsRead(
        { user: undefined } as any,
        'r-1',
      );
      expect(res).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('should mark room as read', async () => {
      service.markAsRead.mockResolvedValue({ lastReadAt: new Date() });

      const res = await controller.markAsRead(
        { user: { id: 'u-1' } } as any,
        'r-1',
      );

      expect(service.markAsRead).toHaveBeenCalledWith('u-1', 'r-1');
      expect(res).toEqual({ success: true, message: 'Marked as read' });
    });
  });
});
