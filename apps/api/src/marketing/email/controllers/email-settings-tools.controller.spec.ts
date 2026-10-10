import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { EmailSettingsToolsController } from './email-settings-tools.controller.js';
import { PrismaService } from '../../../lib/database/prisma.service.js';
import { EmailAiService } from '../ai/email-ai.service.js';

describe('EmailSettingsToolsController', () => {
  let controller: EmailSettingsToolsController;
  let prisma: any;
  let aiService: jest.Mocked<Partial<EmailAiService>>;

  beforeEach(async () => {
    prisma = {
      emailTag: {
        findMany: jest.fn().mockResolvedValue([{ id: 'tag-1', name: 'Hot' }]),
        upsert: jest.fn().mockResolvedValue({ id: 'tag-1', name: 'Hot' }),
        delete: jest.fn().mockResolvedValue({ id: 'tag-1' }),
      },
    };
    aiService = {
      getAiConfig: jest.fn().mockResolvedValue({ model: 'gpt-4' }),
      saveAiConfig: jest.fn().mockResolvedValue({ saved: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailSettingsToolsController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: EmailAiService, useValue: aiService },
      ],
    }).compile();

    controller = module.get<EmailSettingsToolsController>(
      EmailSettingsToolsController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('getAiConfig ? delegates to aiService.getAiConfig', async () => {
    const res = await controller.getAiConfig();
    expect(aiService.getAiConfig).toHaveBeenCalled();
    expect(res).toEqual({ model: 'gpt-4' });
  });

  it('saveAiConfig ? delegates dto to aiService.saveAiConfig', async () => {
    await controller.saveAiConfig({ model: 'gpt-4o' });
    expect(aiService.saveAiConfig).toHaveBeenCalledWith({ model: 'gpt-4o' });
  });

  it('getTags ? queries prisma.emailTag.findMany sorted by name', async () => {
    const res = await controller.getTags();
    expect(prisma.emailTag.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(res).toEqual([{ id: 'tag-1', name: 'Hot' }]);
  });

  it('createTag ? upserts tag by trimmed name', async () => {
    await controller.createTag({ name: '  VIP  ', color: '#FF0000' });
    expect(prisma.emailTag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'VIP' },
        create: { name: 'VIP', color: '#FF0000' },
      }),
    );
  });

  it('deleteTag ? deletes by id', async () => {
    await controller.deleteTag('tag-1');
    expect(prisma.emailTag.delete).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
  });
});
