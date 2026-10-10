jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { WhatsAppMessagesController } from './whatsapp-messages.controller.js';

describe('WhatsAppMessagesController', () => {
  let controller: WhatsAppMessagesController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      sendTemplateDirect: jest.fn(),
    };

    controller = new WhatsAppMessagesController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getMessages', async () => {
    mockService.getMessages.mockResolvedValue({ items: [] });

    const res = await controller.getMessages('conv-1', {});
    expect(mockService.getMessages).toHaveBeenCalledWith('conv-1', {});
    expect(res).toEqual({ items: [] });
  });

  it('should call sendMessageDirect', async () => {
    const dto: any = { conversationId: 'conv-1', type: 'text', text: 'Direct hello' };
    mockService.sendMessage.mockResolvedValue({ id: 'm-1' });

    const res = await controller.sendMessageDirect(dto, { user: { id: 'u-1', name: 'Agent' } });
    expect(mockService.sendMessage).toHaveBeenCalledWith('conv-1', dto, { id: 'u-1', name: 'Agent' });
    expect(res).toEqual({ id: 'm-1' });
  });

  it('should call sendTemplateDirect', async () => {
    const dto: any = { to: '+919876543210', templateName: 'lead_welcome' };
    mockService.sendTemplateDirect.mockResolvedValue({ success: true, messageId: 'm-2' });

    const res = await controller.sendTemplateDirect(dto, { user: { id: 'u-1' } });
    expect(mockService.sendTemplateDirect).toHaveBeenCalledWith(dto, { id: 'u-1' });
    expect(res).toEqual({ success: true, messageId: 'm-2' });
  });

  it('should call sendMessage by conversationId param', async () => {
    const dto: any = { type: 'text', text: 'Param hello' };
    mockService.sendMessage.mockResolvedValue({ id: 'm-3' });

    const res = await controller.sendMessage('conv-2', dto, {});
    expect(mockService.sendMessage).toHaveBeenCalledWith('conv-2', dto, undefined);
    expect(res).toEqual({ id: 'm-3' });
  });
});
