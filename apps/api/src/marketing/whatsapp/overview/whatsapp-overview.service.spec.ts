import { WhatsAppOverviewService } from './whatsapp-overview.service.js';

describe('WhatsAppOverviewService', () => {
  let service: WhatsAppOverviewService;
  let mockPrisma: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      getDecryptedAccount: jest.fn(),
    };

    mockPrisma = {
      whatsAppConversation: {
        count: jest.fn().mockResolvedValue(10),
        aggregate: jest.fn().mockResolvedValue({ _sum: { unreadCount: 3 } }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c-1',
            contactName: 'Ravi Kumar',
            contactPhone: '+919876543210',
            status: 'open',
            lastMessageText: 'Is the 3BHK available?',
            lastMessageAt: new Date(),
            unreadCount: 1,
          },
        ]),
      },
      whatsAppBroadcast: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'b-1',
            name: 'Launch Broadcast',
            templateName: 'exclusive_prelaunch',
            status: 'COMPLETED',
            totalRecipients: 500,
            sentCount: 500,
            deliveredCount: 480,
            readCount: 320,
            createdAt: new Date(),
          },
        ]),
      },
      whatsAppContact: {
        count: jest.fn().mockResolvedValue(250),
      },
      whatsAppAiConfig: {
        findUnique: jest.fn().mockResolvedValue({
          isActive: true,
          provider: 'GROQ',
        }),
      },
      whatsAppMessage: {
        count: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.status?.in) return Promise.resolve(90); // delivered + read
          if (args?.where?.status === 'READ') return Promise.resolve(70);
          if (args?.where?.status === 'FAILED') return Promise.resolve(5);
          if (args?.where?.direction === 'INBOUND') return Promise.resolve(40);
          return Promise.resolve(100); // total sent
        }),
        findMany: jest.fn().mockResolvedValue([
          { direction: 'OUTBOUND', createdAt: new Date() },
          { direction: 'INBOUND', createdAt: new Date() },
        ]),
      },
    };

    service = new WhatsAppOverviewService(mockConfigService);
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverviewStats', () => {
    it('should aggregate metrics when account is connected', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        id: 'acc-1',
        isActive: true,
      });

      const res = await service.getOverviewStats('acc-1');

      expect(res.connected).toBe(true);
      expect(res.activeConversations).toBe(10);
      expect(res.totalUnread).toBe(3);
      expect(res.totalBroadcasts).toBe(4);
      expect(res.totalContacts).toBe(250);
      expect(res.aiActive).toBe(true);
      expect(res.aiProvider).toBe('GROQ');
      expect(res.funnel.totalSent).toBe(100);
      expect(res.funnel.totalDelivered).toBe(90);
      expect(res.funnel.totalRead).toBe(70);
      expect(res.traffic7Days.length).toBe(7);
      expect(res.recentConversations.length).toBe(1);
      expect(res.recentBroadcasts.length).toBe(1);
    });

    it('should handle when no account is found', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue(null);

      const res = await service.getOverviewStats();

      expect(res.connected).toBe(false);
      expect(res.aiActive).toBe(false);
      expect(res.aiProvider).toBeNull();
    });
  });
});
