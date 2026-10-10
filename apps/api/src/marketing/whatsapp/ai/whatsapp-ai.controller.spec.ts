jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppAiController } from './whatsapp-ai.controller.js';
import { WhatsAppAiService } from './whatsapp-ai.service.js';

describe('WhatsAppAiController', () => {
  let controller: WhatsAppAiController;
  let mockAiService: Partial<Record<keyof WhatsAppAiService, jest.Mock>>;

  beforeEach(async () => {
    mockAiService = {
      getAiConfig: jest.fn(),
      saveAiConfig: jest.fn(),
      deleteAiConfig: jest.fn(),
      draftReply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppAiController],
      providers: [{ provide: WhatsAppAiService, useValue: mockAiService }],
    }).compile();

    controller = module.get<WhatsAppAiController>(WhatsAppAiController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAiConfig', () => {
    it('should delegate to aiService.getAiConfig', async () => {
      mockAiService.getAiConfig!.mockResolvedValue({ id: 'config-1', provider: 'groq' });

      const res = await controller.getAiConfig('acc-1');
      expect(mockAiService.getAiConfig).toHaveBeenCalledWith('acc-1');
      expect(res).toEqual({ id: 'config-1', provider: 'groq' });
    });
  });

  describe('saveAiConfig', () => {
    it('should delegate to aiService.saveAiConfig', async () => {
      const dto = { provider: 'groq', model: 'gpt-4o' };
      mockAiService.saveAiConfig!.mockResolvedValue({ id: 'config-1', ...dto });

      const res = await controller.saveAiConfig('acc-1', dto as any);
      expect(mockAiService.saveAiConfig).toHaveBeenCalledWith('acc-1', dto);
      expect(res).toEqual({ id: 'config-1', ...dto });
    });
  });

  describe('deleteAiConfig', () => {
    it('should delegate to aiService.deleteAiConfig', async () => {
      mockAiService.deleteAiConfig!.mockResolvedValue({ success: true });

      const res = await controller.deleteAiConfig('acc-1');
      expect(mockAiService.deleteAiConfig).toHaveBeenCalledWith('acc-1');
      expect(res).toEqual({ success: true });
    });
  });

  describe('draftReply', () => {
    it('should delegate to aiService.draftReply', async () => {
      mockAiService.draftReply!.mockResolvedValue({ draft: 'Hello, how can I help you today?' });

      const dto = {
        conversationId: 'conv-1',
        agentName: 'Agent John',
        instruction: 'Short answer',
      };

      const res = await controller.draftReply('acc-1', dto as any);
      expect(mockAiService.draftReply).toHaveBeenCalledWith(
        'acc-1',
        'conv-1',
        'Agent John',
        'Short answer',
      );
      expect(res).toEqual({ draft: 'Hello, how can I help you today?' });
    });
  });
});
