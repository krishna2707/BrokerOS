import { NotFoundException } from '@nestjs/common';
import { VoiceAnalyticsService } from './voice-analytics.service.js';

describe('VoiceAnalyticsService', () => {
  let service: VoiceAnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      voiceCampaign: {
        findUnique: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      voiceRecipient: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new VoiceAnalyticsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaignAnalytics', () => {
    it('should throw NotFoundException if voice campaign does not exist', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignAnalytics('c-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should compute metrics, sentiment counts and return call logs', async () => {
      mockPrisma.voiceCampaign.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'NRI Outbound Campaign',
        status: 'COMPLETED',
        totalRecipients: 100,
        completedCalls: 80,
        busyCalls: 10,
        noAnswerCalls: 5,
        failedCalls: 5,
        totalDurationSec: 4800,
        callerIdNumber: '+911140005000',
        telephony: { provider: 'TWILIO' },
        agentIntegration: { platform: 'VAPI' },
        recipients: [
          {
            id: 'r-1',
            phone: '+919876543210',
            name: 'Raj Malhotra',
            callDurationSec: 60,
            disposition: 'COMPLETED',
            sentiment: 'POSITIVE',
            summary: 'Interested in luxury 4BHK',
            recordingUrl: 'https://cdn.example.com/rec1.wav',
            transcript: 'Hello, yes tell me more.',
          },
        ],
      });

      mockPrisma.voiceRecipient.count
        .mockResolvedValueOnce(50) // positive
        .mockResolvedValueOnce(25) // neutral
        .mockResolvedValueOnce(5); // negative

      const res = await service.getCampaignAnalytics('c-1');

      expect(res.campaignId).toBe('c-1');
      expect(res.totalRecipients).toBe(100);
      expect(res.completedCalls).toBe(80);
      expect(res.completionRate).toBe(80);
      expect(res.averageDurationSec).toBe(60); // 4800 / 80
      expect(res.sentimentBreakdown.positive).toBe(50);
      expect(res.sentimentBreakdown.neutral).toBe(25);
      expect(res.sentimentBreakdown.negative).toBe(5);
      expect(res.recentCallLogs.length).toBe(1);
      expect(res.recentCallLogs[0].mappedTemperature).toBe('HOT'); // POSITIVE maps to HOT
    });
  });

  describe('getOverallMetrics', () => {
    it('should compute overall voice marketing platform metrics', async () => {
      mockPrisma.voiceCampaign.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(3) // active
        .mockResolvedValueOnce(15); // completed

      mockPrisma.voiceCampaign.aggregate.mockResolvedValue({
        _sum: {
          totalRecipients: 5000,
          completedCalls: 4000,
          totalDurationSec: 240000,
        },
      });

      const res = await service.getOverallMetrics();

      expect(res.totalCampaigns).toBe(20);
      expect(res.activeCampaigns).toBe(3);
      expect(res.completedCampaigns).toBe(15);
      expect(res.totalCallsPlaced).toBe(5000);
      expect(res.totalCallsCompleted).toBe(4000);
      expect(res.totalTalkTimeSec).toBe(240000);
      expect(res.overallCompletionRate).toBe(80);
    });
  });

  describe('getCampaignRecipients', () => {
    it('should return paginated recipients with filter', async () => {
      mockPrisma.voiceRecipient.findMany.mockResolvedValue([
        { id: 'r-1', phone: '+919876543210' },
      ]);
      mockPrisma.voiceRecipient.count.mockResolvedValue(1);

      const res = await service.getCampaignRecipients('c-1', {
        page: 1,
        limit: 10,
        status: 'COMPLETED',
        search: 'Raj',
      });

      expect(res.items.length).toBe(1);
      expect(res.total).toBe(1);
      expect(res.totalPages).toBe(1);
      expect(mockPrisma.voiceRecipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campaignId: 'c-1',
            status: 'COMPLETED',
          }),
        }),
      );
    });
  });
});
