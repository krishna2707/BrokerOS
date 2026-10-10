jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-whatsapp', () => ({
  encrypt: jest.fn((k: string) => `encrypted_${k}`),
  decrypt: jest.fn((k: string) => k.replace('encrypted_', '')),
}));

import { EmailAiService } from './email-ai.service.js';

describe('EmailAiService', () => {
  let service: EmailAiService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      emailAiConfig: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new EmailAiService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAiConfig', () => {
    it('should return default config if none found in database', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue(null);

      const config = await service.getAiConfig();
      expect(config.provider).toBe('groq');
      expect(config.model).toBe('openai/gpt-oss-120b');
      expect(config.apiKey).toBeNull();
    });

    it('should return masked apiKey when saved in DB', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue({
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        apiKey: 'encrypted_secret_key',
        isActive: true,
      });

      const config = await service.getAiConfig();
      expect(config.apiKey).toBe('••••••••');
    });
  });

  describe('saveAiConfig', () => {
    it('should create new AI config if none exists', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue(null);
      mockPrisma.emailAiConfig.create.mockResolvedValue({
        id: 'cfg-1',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
      });

      const res = await service.saveAiConfig({
        provider: 'groq',
        apiKey: 'my-groq-key',
      });

      expect(mockPrisma.emailAiConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider: 'groq',
            apiKey: 'encrypted_my-groq-key',
          }),
        }),
      );
      expect(res.id).toBe('cfg-1');
    });

    it('should update existing AI config and preserve key if masked', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue({
        id: 'cfg-1',
        apiKey: 'encrypted_existing_key',
      });
      mockPrisma.emailAiConfig.update.mockResolvedValue({ id: 'cfg-1' });

      await service.saveAiConfig({
        provider: 'groq',
        apiKey: '••••••••',
      });

      expect(mockPrisma.emailAiConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apiKey: 'encrypted_existing_key',
          }),
        }),
      );
    });
  });

  describe('generateAutoreply', () => {
    it('should parse successful JSON response from LLM endpoint', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue({
        isActive: true,
        apiKey: 'encrypted_real_key',
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
      });

      const fakeResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                subject: 'Re: 3BHK Availability',
                body: 'We have 3 units available on higher floors.',
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(fakeResponse),
      }) as any;

      const reply = await service.generateAutoreply({
        leadName: 'Vikram',
        advisorName: 'Amit',
        inboundSubject: '3BHK Availability',
        inboundBody: 'Is there a 3BHK left?',
        project: { name: 'Skyline Heights', city: 'Worli' },
      });

      expect(reply.subject).toBe('Re: 3BHK Availability');
      expect(reply.textBody).toContain('3 units available');
      expect(reply.htmlBody).toContain('3 units available');
    });

    it('should use dynamic fallback when fetch fails or no API key', async () => {
      mockPrisma.emailAiConfig.findFirst.mockResolvedValue(null);
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAi = process.env.OPENAI_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const reply = await service.generateAutoreply({
        leadName: 'Rahul',
        advisorName: 'Sneha',
        inboundSubject: 'Visit inquiry',
        inboundBody: 'When can I visit?',
        project: { name: 'Skyline Palms', city: 'Bandra' },
      });

      expect(reply.subject).toBeDefined();
      expect(reply.textBody).toContain('Rahul');
      expect(reply.textBody).toContain('Sneha');

      process.env.GROQ_API_KEY = originalGroq;
      process.env.OPENAI_API_KEY = originalOpenAi;
    });
  });
});
