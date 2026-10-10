jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-meta', () => ({
  MetaGraphApiClient: class {
    getLeadDetails = jest.fn().mockResolvedValue({
      leadId: 'lg-12345',
      formId: 'form-1',
      adName: 'Penthouse Carousel Ad',
      campaignName: 'Luxury Gurugram',
      phoneNumber: '+919876543210',
      fullName: 'Alice Walker',
      firstName: 'Alice',
      lastName: 'Walker',
      email: 'alice@example.com',
      city: 'Gurugram',
      budget: '7500000',
      customFields: { bhk: '4BHK' },
    });
  },
}));

import { MetaLeadsService } from './meta-leads.service.js';

describe('MetaLeadsService', () => {
  let service: MetaLeadsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      metaAdIntegration: {
        findFirst: jest.fn(),
      },
      metaLeadWebhookLog: {
        create: jest.fn(),
      },
      leadSource: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new MetaLeadsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processLeadgenEvent', () => {
    it('should process leadgen change, create lead, and log success', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue({
        id: 'meta-int-1',
        accessToken: 'access-token-1',
      });
      mockPrisma.leadSource.findFirst.mockResolvedValue({
        id: 'src-fb',
        type: 'FACEBOOK_ADS',
      });
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.lead.create.mockResolvedValue({ id: 'crm-lead-1' });
      mockPrisma.metaLeadWebhookLog.create.mockResolvedValue({ id: 'log-1' });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page_123',
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: 'lg-12345',
                  form_id: 'form-1',
                  ad_id: 'ad-100',
                  campaign_id: 'camp-200',
                },
              },
            ],
          },
        ],
      };

      const res = await service.processLeadgenEvent(payload);

      expect(res.processedCount).toBe(1);
      expect(res.results?.[0]?.crmLeadId).toBe('crm-lead-1');
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Alice',
            lastName: 'Walker',
            phone: '+919876543210',
            email: 'alice@example.com',
            preferredLocation: 'Gurugram',
            budget: 7500000,
            status: 'NEW',
            temperature: 'HOT',
          }),
        }),
      );
      expect(mockPrisma.metaLeadWebhookLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            integrationId: 'meta-int-1',
            leadgenId: 'lg-12345',
            status: 'PROCESSED',
          }),
        }),
      );
    });

    it('should handle unmatched integration by logging UNMATCHED_INTEGRATION status', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue(null);
      mockPrisma.metaLeadWebhookLog.create.mockResolvedValue({
        id: 'log-unmatched',
      });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'unmatched_page',
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: 'lg-unmatched',
                },
              },
            ],
          },
        ],
      };

      const res = await service.processLeadgenEvent(payload);

      expect(res.processedCount).toBe(0);
      expect(mockPrisma.metaLeadWebhookLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UNMATCHED_INTEGRATION',
          }),
        }),
      );
    });

    it('should handle Graph API getLeadDetails error by logging FETCH_ERROR', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue({
        id: 'meta-int-1',
        accessToken: 'expired-token',
      });
      (service as any).client.getLeadDetails = jest
        .fn()
        .mockRejectedValue(new Error('Session has expired'));
      mockPrisma.metaLeadWebhookLog.create.mockResolvedValue({ id: 'log-err' });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page_123',
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: 'lg-err',
                },
              },
            ],
          },
        ],
      };

      const res = await service.processLeadgenEvent(payload);

      expect(res.processedCount).toBe(0);
      expect(mockPrisma.metaLeadWebhookLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FETCH_ERROR',
            errorMessage: 'Session has expired',
          }),
        }),
      );
    });

    it('should update existing lead summary if phone already exists', async () => {
      (service as any).client.getLeadDetails = jest.fn().mockResolvedValue({
        phoneNumber: '+919876543210',
        fullName: 'Alice Walker',
        campaignName: 'Retargeting Camp',
      });
      mockPrisma.metaAdIntegration.findFirst.mockResolvedValue({
        id: 'meta-int-1',
        accessToken: 'valid-token',
      });
      mockPrisma.leadSource.findFirst.mockResolvedValue(null);
      mockPrisma.leadSource.create.mockResolvedValue({ id: 'src-created' });
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'crm-lead-existing',
        phone: '+919876543210',
        customerSummary: 'Visited website previously',
      });
      mockPrisma.lead.update.mockResolvedValue({ id: 'crm-lead-existing' });
      mockPrisma.metaLeadWebhookLog.create.mockResolvedValue({
        id: 'log-update',
      });

      const payload = {
        object: 'page',
        entry: [
          {
            id: 'page_123',
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: 'lg-existing',
                },
              },
            ],
          },
        ],
      };

      const res = await service.processLeadgenEvent(payload);

      expect(res.processedCount).toBe(1);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'crm-lead-existing' },
          data: expect.objectContaining({
            customerSummary: expect.stringContaining(
              'Visited website previously',
            ),
          }),
        }),
      );
    });

    it('should catch top-level exceptions and return success: false', async () => {
      mockPrisma.metaAdIntegration.findFirst.mockRejectedValue(
        new Error('Fatal DB crash'),
      );

      const payload = {
        entry: [
          {
            id: 'page_1',
            changes: [{ field: 'leadgen', value: { leadgen_id: 'lg-crash' } }],
          },
        ],
      };

      const res = await service.processLeadgenEvent(payload);

      expect(res.success).toBe(false);
      expect(res.error).toBe('Fatal DB crash');
    });
  });
});
