jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { WhatsAppConversationsController } from './whatsapp-conversations.controller.js';

describe('WhatsAppConversationsController', () => {
  let controller: WhatsAppConversationsController;
  let mockConversationsService: any;
  let mockMessagesService: any;

  beforeEach(() => {
    mockConversationsService = {
      listConversations: jest.fn(),
      startOrCreateConversation: jest.fn(),
      getConversation: jest.fn(),
      updateStatus: jest.fn(),
      assignAgent: jest.fn(),
      markRead: jest.fn(),
    };

    mockMessagesService = {
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    };

    controller = new WhatsAppConversationsController(
      mockConversationsService,
      mockMessagesService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listConversations', async () => {
    mockConversationsService.listConversations.mockResolvedValue({ items: [] });

    const res = await controller.listConversations({});
    expect(mockConversationsService.listConversations).toHaveBeenCalledWith({});
    expect(res).toEqual({ items: [] });
  });

  it('should call startOrCreateConversation', async () => {
    const dto = { phone: '+919876543210' };
    mockConversationsService.startOrCreateConversation.mockResolvedValue({ id: 'c-1' });

    const res = await controller.startConversation(dto);
    expect(mockConversationsService.startOrCreateConversation).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'c-1' });
  });

  it('should call startOrCreateConversation via startConversationAlias', async () => {
    const dto = { phone: '+919876543210' };
    mockConversationsService.startOrCreateConversation.mockResolvedValue({ id: 'c-1' });

    const res = await controller.startConversationAlias(dto);
    expect(mockConversationsService.startOrCreateConversation).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'c-1' });
  });

  it('should call getConversation', async () => {
    mockConversationsService.getConversation.mockResolvedValue({ id: 'c-1' });

    const res = await controller.getConversation('c-1');
    expect(mockConversationsService.getConversation).toHaveBeenCalledWith('c-1');
    expect(res).toEqual({ id: 'c-1' });
  });

  it('should call getMessages on messagesService', async () => {
    mockMessagesService.getMessages.mockResolvedValue({ items: [] });

    const res = await controller.getMessages('c-1', {});
    expect(mockMessagesService.getMessages).toHaveBeenCalledWith('c-1', {});
    expect(res).toEqual({ items: [] });
  });

  it('should call sendMessage on messagesService', async () => {
    const dto: any = { type: 'text', text: 'Hi' };
    mockMessagesService.sendMessage.mockResolvedValue({ id: 'm-1' });

    const res = await controller.sendMessage('c-1', dto, { user: { id: 'u-1', name: 'Agent' } });
    expect(mockMessagesService.sendMessage).toHaveBeenCalledWith('c-1', dto, { id: 'u-1', name: 'Agent' });
    expect(res).toEqual({ id: 'm-1' });
  });

  it('should call updateStatus', async () => {
    mockConversationsService.updateStatus.mockResolvedValue({ id: 'c-1', status: 'closed' });

    const res = await controller.updateStatus('c-1', { status: 'closed' });
    expect(mockConversationsService.updateStatus).toHaveBeenCalledWith('c-1', 'closed');
    expect(res.status).toBe('closed');
  });

  it('should call assignAgent', async () => {
    mockConversationsService.assignAgent.mockResolvedValue({ id: 'c-1', agentUserId: 'u-2' });

    const res = await controller.assignAgent('c-1', { agentUserId: 'u-2' }, {});
    expect(mockConversationsService.assignAgent).toHaveBeenCalledWith('c-1', 'u-2');
    expect(res.agentUserId).toBe('u-2');
  });

  it('should call markRead', async () => {
    mockConversationsService.markRead.mockResolvedValue({ id: 'c-1', unreadCount: 0 });

    const res = await controller.markRead('c-1');
    expect(mockConversationsService.markRead).toHaveBeenCalledWith('c-1');
    expect(res.unreadCount).toBe(0);
  });
});
