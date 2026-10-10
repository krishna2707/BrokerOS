jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));
jest.mock('@brokeros/int-whatsapp', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted_key'),
  decrypt: jest.fn().mockReturnValue('decrypted_key'),
}));

import { SmsAiService } from './sms-ai.service.js';

describe('SmsAiService', () => {
  let service: SmsAiService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsAiConfig: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new SmsAiService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAiConfig', () => {
    it('should return default configuration if none stored', async () => {
      mockPrisma.smsAiConfig.findFirst.mockResolvedValue(null);

      const res = await service.getAiConfig();
      expect(res.provider).toBe('groq');
      expect(res.model).toBe('openai/gpt-oss-120b');
      expect(res.maxCharacters).toBe(160);
      expect(res.apiKey).toBeNull();
    });

    it('should mask apiKey if config exists', async () => {
      mockPrisma.smsAiConfig.findFirst.mockResolvedValue({
        id: 'cfg-1',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: 'enc_secret',
        maxCharacters: 160,
      });

      const res = await service.getAiConfig();
      expect(res.apiKey).toBe('••••••••');
    });
  });

  describe('saveAiConfig', () => {
    it('should create new config if none exists', async () => {
      mockPrisma.smsAiConfig.findFirst.mockResolvedValue(null);
      mockPrisma.smsAiConfig.create.mockResolvedValue({ id: 'cfg-new' });

      const res = await service.saveAiConfig({
        provider: 'groq',
        apiKey: 'gsk_1234567890',
        model: 'openai/gpt-oss-120b',
        maxCharacters: 150,
      });

      expect(mockPrisma.smsAiConfig.create).toHaveBeenCalled();
      expect(res.id).toBe('cfg-new');
    });

    it('should update existing config', async () => {
      mockPrisma.smsAiConfig.findFirst.mockResolvedValue({
        id: 'cfg-1',
        apiKey: 'old_enc',
      });
      mockPrisma.smsAiConfig.update.mockResolvedValue({ id: 'cfg-1' });

      const res = await service.saveAiConfig({
        provider: 'openai',
        apiKey: 'sk-new',
        maxCharacters: 160,
      });

      expect(mockPrisma.smsAiConfig.update).toHaveBeenCalled();
      expect(res.id).toBe('cfg-1');
    });
  });

  describe('generateAutoreply', () => {
    it('should fallback to contextual response if no API key is available', async () => {
      mockPrisma.smsAiConfig.findFirst.mockResolvedValue(null);

      const originalKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;

      const res = await service.generateAutoreply({
        leadName: 'Vikram',
        originalCampaignTitle: 'Skyline Palms',
        inboundBody: 'When can I visit?',
      });

      expect(res.text).toBeDefined();
      expect(res.text.length).toBeLessThanOrEqual(160);
      expect(res.modelUsed).toBe('context-fallback');

      if (originalKey) process.env.GROQ_API_KEY = originalKey;
    });
  });
});
