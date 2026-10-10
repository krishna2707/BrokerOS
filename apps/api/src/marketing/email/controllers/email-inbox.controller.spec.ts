import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { EmailInboxController } from './email-inbox.controller.js';
import { EmailInboxService } from '../services/email-inbox.service.js';

describe('EmailInboxController', () => {
  let controller: EmailInboxController;
  let inboxService: jest.Mocked<Partial<EmailInboxService>>;

  beforeEach(async () => {
    inboxService = {
      listConversations: jest.fn().mockResolvedValue([{ id: 'conv-1' }]),
      startConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      getConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      getMessages: jest.fn().mockResolvedValue([{ id: 'msg-1' }]),
      sendReply: jest.fn().mockResolvedValue({ id: 'msg-2' }),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: 'conv-1', status: 'CLOSED' }),
      assignAgent: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      markRead: jest.fn().mockResolvedValue({}),
      draftAiReply: jest.fn().mockResolvedValue({ draft: 'AI reply...' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailInboxController],
      providers: [{ provide: EmailInboxService, useValue: inboxService }],
    }).compile();

    controller = module.get<EmailInboxController>(EmailInboxController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('listConversations ? delegates query', async () => {
    const res = await controller.listConversations({ status: 'OPEN' });
    expect(inboxService.listConversations).toHaveBeenCalledWith({
      status: 'OPEN',
    });
    expect(res).toEqual([{ id: 'conv-1' }]);
  });

  it('startConversation ? passes sender from req.user', async () => {
    const req = { user: { id: 'u-1', name: 'Alice', email: 'a@b.com' } };
    const dto = { to: 'lead@x.com', subject: 'Hi' } as any;
    await controller.startConversation(dto, req);
    expect(inboxService.startConversation).toHaveBeenCalledWith(dto, {
      id: 'u-1',
      name: 'Alice',
      email: 'a@b.com',
    });
  });

  it('startConversation ? passes undefined sender when no user', async () => {
    await controller.startConversation({} as any, {});
    expect(inboxService.startConversation).toHaveBeenCalledWith({}, undefined);
  });

  it('getConversation ? delegates id', async () => {
    await controller.getConversation('conv-1');
    expect(inboxService.getConversation).toHaveBeenCalledWith('conv-1');
  });

  it('getMessages ? delegates id and query', async () => {
    await controller.getMessages('conv-1', {});
    expect(inboxService.getMessages).toHaveBeenCalledWith('conv-1', {});
  });

  it('sendReply ? passes sender from req.user', async () => {
    const req = { user: { id: 'u-1', name: 'Alice', email: 'a@b.com' } };
    await controller.sendReply('conv-1', { body: 'Yes' } as any, req);
    expect(inboxService.sendReply).toHaveBeenCalledWith(
      'conv-1',
      { body: 'Yes' },
      { id: 'u-1', name: 'Alice', email: 'a@b.com' },
    );
  });

  it('updateStatus ? delegates id and status', async () => {
    await controller.updateStatus('conv-1', { status: 'CLOSED' } as any);
    expect(inboxService.updateStatus).toHaveBeenCalledWith('conv-1', 'CLOSED');
  });

  it('assignAgent ? uses dto.agentUserId when provided', async () => {
    await controller.assignAgent('conv-1', { agentUserId: 'agent-99' }, {});
    expect(inboxService.assignAgent).toHaveBeenCalledWith('conv-1', 'agent-99');
  });

  it('assignAgent ? falls back to req.user.id when no dto.agentUserId', async () => {
    const req = { user: { id: 'u-1' } };
    await controller.assignAgent('conv-1', {}, req);
    expect(inboxService.assignAgent).toHaveBeenCalledWith('conv-1', 'u-1');
  });

  it('markRead ? delegates id', async () => {
    await controller.markRead('conv-1');
    expect(inboxService.markRead).toHaveBeenCalledWith('conv-1');
  });

  it('draftAiReply ? delegates id and dto', async () => {
    const res = await controller.draftAiReply('conv-1', {
      tone: 'professional',
    } as any);
    expect(inboxService.draftAiReply).toHaveBeenCalledWith('conv-1', {
      tone: 'professional',
    });
    expect(res).toEqual({ draft: 'AI reply...' });
  });
});
