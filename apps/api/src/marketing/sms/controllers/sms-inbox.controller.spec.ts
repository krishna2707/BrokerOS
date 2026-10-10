import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn(),
}));
import { SmsInboxController } from './sms-inbox.controller.js';
import { SmsInboxService } from '../services/sms-inbox.service.js';
describe('SmsInboxController', () => {
  let controller: SmsInboxController;
  let inboxService: jest.Mocked<Partial<SmsInboxService>>;
  beforeEach(async () => {
    inboxService = {
      listConversations: jest.fn().mockResolvedValue([{ id: 'conv-1' }]),
      startConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      getConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      getMessages: jest.fn().mockResolvedValue([]),
      sendReply: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      updateStatus: jest.fn().mockResolvedValue({ status: 'CLOSED' }),
      assignAgent: jest.fn().mockResolvedValue({}),
      toggleAiAutoReply: jest.fn().mockResolvedValue({}),
      markRead: jest.fn().mockResolvedValue({}),
      draftAiReply: jest
        .fn()
        .mockResolvedValue({ text: 'AI reply', modelUsed: 'gpt-4o' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsInboxController],
      providers: [{ provide: SmsInboxService, useValue: inboxService }],
    }).compile();
    controller = module.get<SmsInboxController>(SmsInboxController);
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('listConversations', async () => {
    await controller.listConversations({});
    expect(inboxService.listConversations).toHaveBeenCalled();
  });
  it('startConversation passes sender from req.user', async () => {
    await controller.startConversation({ to: '+91...' } as any, {
      user: { id: 'u-1', name: 'A', email: 'a@b.com' },
    });
    expect(inboxService.startConversation).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'u-1', name: 'A', email: 'a@b.com' },
    );
  });
  it('getConversation', async () => {
    await controller.getConversation('conv-1');
    expect(inboxService.getConversation).toHaveBeenCalledWith('conv-1');
  });
  it('getMessages', async () => {
    await controller.getMessages('conv-1', {});
    expect(inboxService.getMessages).toHaveBeenCalledWith('conv-1', {});
  });
  it('sendReply passes sender', async () => {
    await controller.sendReply('conv-1', { body: 'Hi' } as any, {
      user: { id: 'u-1', name: 'A', email: 'a@b.com' },
    });
    expect(inboxService.sendReply).toHaveBeenCalled();
  });
  it('updateStatus', async () => {
    await controller.updateStatus('conv-1', { status: 'CLOSED' } as any);
    expect(inboxService.updateStatus).toHaveBeenCalledWith('conv-1', 'CLOSED');
  });
  it('assignAgent uses dto.agentUserId', async () => {
    await controller.assignAgent('conv-1', { agentUserId: 'agent-99' }, {});
    expect(inboxService.assignAgent).toHaveBeenCalledWith('conv-1', 'agent-99');
  });
  it('assignAgent falls back to req.user.id', async () => {
    await controller.assignAgent('conv-1', {}, { user: { id: 'u-1' } });
    expect(inboxService.assignAgent).toHaveBeenCalledWith('conv-1', 'u-1');
  });
  it('toggleAiAutoReply', async () => {
    await controller.toggleAiAutoReply('conv-1', { disabled: true });
    expect(inboxService.toggleAiAutoReply).toHaveBeenCalledWith('conv-1', true);
  });
  it('markRead', async () => {
    await controller.markRead('conv-1');
    expect(inboxService.markRead).toHaveBeenCalledWith('conv-1');
  });
  it('draftAiReply', async () => {
    const res = await controller.draftAiReply('conv-1', {
      tone: 'professional',
    } as any);
    expect(inboxService.draftAiReply).toHaveBeenCalledWith('conv-1', {
      tone: 'professional',
    });
    expect(res.text).toBe('AI reply');
  });
});
