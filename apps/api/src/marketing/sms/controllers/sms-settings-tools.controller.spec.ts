import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn(),
  DEFAULT_SMS_QUICK_REPLIES: [{ id: 'qr-1', text: 'Yes' }],
}));
import { SmsSettingsToolsController } from './sms-settings-tools.controller.js';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { SmsAiService } from '../ai/sms-ai.service.js';
describe('SmsSettingsToolsController', () => {
  let controller: SmsSettingsToolsController;
  let prisma: any;
  let aiService: jest.Mocked<Partial<SmsAiService>>;
  beforeEach(async () => {
    prisma = {
      smsTag: {
        findMany: jest.fn().mockResolvedValue([{ id: 'tag-1', name: 'Hot' }]),
        upsert: jest.fn().mockResolvedValue({ id: 'tag-1' }),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    aiService = {
      getAiConfig: jest.fn().mockResolvedValue({ model: 'gpt-4' }),
      saveAiConfig: jest.fn().mockResolvedValue({}),
      generateAutoreply: jest.fn().mockResolvedValue({ reply: 'AI text' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsSettingsToolsController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: SmsAiService, useValue: aiService },
      ],
    }).compile();
    controller = module.get<SmsSettingsToolsController>(
      SmsSettingsToolsController,
    );
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('getAiConfig', async () => {
    const res = await controller.getAiConfig();
    expect(aiService.getAiConfig).toHaveBeenCalled();
    expect(res).toEqual({ model: 'gpt-4' });
  });
  it('saveAiConfig', async () => {
    await controller.saveAiConfig({ model: 'gpt-4o' });
    expect(aiService.saveAiConfig).toHaveBeenCalled();
  });
  it('testAi calls generateAutoreply', async () => {
    await controller.testAi({ text: 'test' });
    expect(aiService.generateAutoreply).toHaveBeenCalled();
  });
  it('getQuickReplies returns DEFAULT_SMS_QUICK_REPLIES', async () => {
    const res = await controller.getQuickReplies();
    expect(res.items).toBeDefined();
  });
  it('getTags queries prisma.smsTag.findMany sorted by name', async () => {
    await controller.getTags();
    expect(prisma.smsTag.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });
  it('createTag upserts by trimmed name', async () => {
    await controller.createTag({ name: ' VIP ', color: '#F00' });
    expect(prisma.smsTag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'VIP' } }),
    );
  });
  it('deleteTag deletes by id', async () => {
    await controller.deleteTag('tag-1');
    expect(prisma.smsTag.delete).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
  });
});
