import { VoiceTrackingService } from './voice-tracking.service.js';

describe('VoiceTrackingService', () => {
  let service: VoiceTrackingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      voiceRecipient: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      voiceCallLog: {
        create: jest.fn(),
      },
      lead: {
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      note: {
        create: jest.fn(),
      },
      callRecord: {
        create: jest.fn(),
      },
    };

    service = new VoiceTrackingService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhookEvents', () => {
    it('should ignore event if no recipient found', async () => {
      mockPrisma.voiceRecipient.findFirst.mockResolvedValue(null);

      await service.processWebhookEvents([
        {
          providerCallId: 'unknown-call',
          recipientPhone: '+919999999999',
          disposition: 'COMPLETED',
          timestamp: new Date(),
        },
      ]);

      expect(mockPrisma.voiceRecipient.update).not.toHaveBeenCalled();
    });

    it('should update recipient and create call log when completed call arrives', async () => {
      mockPrisma.voiceRecipient.findFirst.mockResolvedValue({
        id: 'r-1',
        phone: '+919876543210',
        campaignId: 'camp-100',
        leadId: null,
      });
      mockPrisma.voiceRecipient.update.mockResolvedValue({ id: 'r-1' });
      mockPrisma.voiceCallLog.create.mockResolvedValue({ id: 'log-1' });

      await service.processWebhookEvents([
        {
          providerCallId: 'prov-call-1',
          recipientPhone: '+919876543210',
          disposition: 'COMPLETED',
          durationSec: 120,
          recordingUrl: 'https://cdn.example.com/call.mp3',
          transcript: 'Turn 1: hello',
          summary: 'Interested in project',
          sentiment: 'POSITIVE',
          timestamp: new Date(),
        },
      ]);

      expect(mockPrisma.voiceRecipient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'r-1' },
          data: expect.objectContaining({
            status: 'DELIVERED',
            disposition: 'COMPLETED',
            callDurationSec: 120,
            sentiment: 'POSITIVE',
          }),
        }),
      );
      expect(mockPrisma.voiceCallLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignId: 'camp-100',
            recipientId: 'r-1',
            disposition: 'COMPLETED',
            durationSec: 120,
          }),
        }),
      );
    });

    it('should synchronize lead temperature, note and call record if linked to CRM lead', async () => {
      mockPrisma.voiceRecipient.findFirst.mockResolvedValue({
        id: 'r-1',
        phone: '+919876543210',
        campaignId: 'camp-100',
        leadId: 'crm-lead-55',
        lead: {
          id: 'crm-lead-55',
          assignedUserId: 'agent-user-id',
        },
      });

      mockPrisma.voiceRecipient.update.mockResolvedValue({ id: 'r-1' });
      mockPrisma.voiceCallLog.create.mockResolvedValue({ id: 'log-1' });
      mockPrisma.lead.update.mockResolvedValue({ id: 'crm-lead-55' });
      mockPrisma.note.create.mockResolvedValue({ id: 'n-1' });
      mockPrisma.callRecord.create.mockResolvedValue({ id: 'cr-1' });

      await service.processWebhookEvents([
        {
          providerCallId: 'prov-call-2',
          recipientPhone: '+919876543210',
          disposition: 'COMPLETED',
          durationSec: 60,
          summary: 'Wants to schedule site visit',
          sentiment: 'POSITIVE', // maps to HOT & QUALIFIED
          timestamp: new Date(),
        },
      ]);

      // Lead update check
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'crm-lead-55' },
        data: {
          temperature: 'HOT',
          status: 'QUALIFIED',
        },
      });

      // Note creation check
      expect(mockPrisma.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'crm-lead-55',
            userId: 'agent-user-id',
            noteType: 'AI_VOICE_CALL',
            content: expect.stringContaining('Wants to schedule site visit'),
          }),
        }),
      );

      // Call record check
      expect(mockPrisma.callRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'crm-lead-55',
            userId: 'agent-user-id',
            status: 'CONNECTED',
            duration: 60,
          }),
        }),
      );
    });
  });
});
