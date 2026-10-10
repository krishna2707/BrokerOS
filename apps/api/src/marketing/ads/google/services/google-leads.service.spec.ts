jest.mock('../../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-ads-google', () => ({
  GoogleAdsApiClient: class {
    verifyLeadWebhook = jest.fn().mockReturnValue(true);
    parseLeadData = jest.fn().mockReturnValue({
      leadId: 'lead-12345',
      campaignId: 'camp-100',
      formId: 'form-200',
      gclid: 'gclid-test',
      phoneNumber: '+919876543210',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      city: 'Mumbai',
      budget: '5000000',
      customFields: { unit_type: '3BHK' },
    });
  },
}));

import { GoogleLeadsService } from './google-leads.service.js';

describe('GoogleLeadsService', () => {
  let service: GoogleLeadsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      googleCampaignCache: {
        findUnique: jest.fn(),
      },
      googleAdIntegration: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
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
      googleLeadWebhookLog: {
        create: jest.fn(),
      },
    };

    service = new GoogleLeadsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processLeadWebhook', () => {
    it('should create new lead and log webhook for new phone number', async () => {
      mockPrisma.googleCampaignCache.findUnique.mockResolvedValue({
        id: 'camp-100',
        integrationId: 'int-1',
      });
      mockPrisma.googleAdIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
        name: 'Main Google Ads',
      });
      mockPrisma.leadSource.findFirst.mockResolvedValue({
        id: 'src-google',
        type: 'GOOGLE_ADS',
      });
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-crm-1',
        phone: '+919876543210',
      });
      mockPrisma.googleLeadWebhookLog.create.mockResolvedValue({ id: 'log-1' });

      const res = await service.processLeadWebhook({
        google_key: 'brokeros_google_ads_lead_secret_2026',
      });

      expect(res.success).toBe(true);
      expect(res.googleLeadId).toBe('lead-12345');
      expect(res.crmLeadId).toBe('lead-crm-1');
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            phone: '+919876543210',
            email: 'john@example.com',
            preferredLocation: 'Mumbai',
            budget: 5000000,
            status: 'NEW',
            temperature: 'HOT',
          }),
        }),
      );
      expect(mockPrisma.googleLeadWebhookLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            integrationId: 'int-1',
            campaignId: 'camp-100',
            googleLeadId: 'lead-12345',
            status: 'PROCESSED',
          }),
        }),
      );
    });

    it('should update existing lead summary when phone already exists in CRM', async () => {
      mockPrisma.googleCampaignCache.findUnique.mockResolvedValue(null);
      mockPrisma.googleAdIntegration.findFirst.mockResolvedValue({
        id: 'int-default',
        isActive: true,
      });
      mockPrisma.leadSource.findFirst.mockResolvedValue(null);
      mockPrisma.leadSource.create.mockResolvedValue({
        id: 'src-new',
        type: 'GOOGLE_ADS',
      });
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'lead-crm-existing',
        phone: '+919876543210',
        customerSummary: 'Existing interest in Sector 62',
      });
      mockPrisma.lead.update.mockResolvedValue({ id: 'lead-crm-existing' });
      mockPrisma.googleLeadWebhookLog.create.mockResolvedValue({ id: 'log-2' });

      const res = await service.processLeadWebhook({});

      expect(res.success).toBe(true);
      expect(res.crmLeadId).toBe('lead-crm-existing');
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-crm-existing' },
          data: expect.objectContaining({
            customerSummary: expect.stringContaining(
              'Existing interest in Sector 62',
            ),
          }),
        }),
      );
    });

    it('should catch error and return success: false if database fails', async () => {
      mockPrisma.googleCampaignCache.findUnique.mockRejectedValue(
        new Error('DB Connection lost'),
      );

      const res = await service.processLeadWebhook({});

      expect(res.success).toBe(false);
      expect(res.error).toBe('DB Connection lost');
    });
  });
});
