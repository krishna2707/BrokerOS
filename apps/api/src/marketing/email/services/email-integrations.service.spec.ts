jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

const mockAdapterInstance = {
  sendBatch: jest.fn().mockResolvedValue({
    success: true,
    provider: 'AWS_SES',
    sentCount: 1,
    failedCount: 0,
    recipientErrors: [],
  }),
  validateCredentials: jest.fn().mockResolvedValue(true),
  verifySenderIdentity: jest.fn().mockResolvedValue({ isVerified: true }),
  listVerifiedSenders: jest
    .fn()
    .mockResolvedValue([
      { fromEmail: 'verified@example.com', isVerified: true },
    ]),
};

jest.mock('@brokeros/int-mail-ses', () => ({
  SesAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-sendgrid', () => ({
  SendgridAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-brevo', () => ({
  BrevoAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-mailchimp', () => ({
  MailchimpAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-mailgun', () => ({
  MailgunAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-gmail', () => ({
  GmailAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-outlook', () => ({
  OutlookAdapter: jest.fn().mockImplementation(() => mockAdapterInstance),
}));
jest.mock('@brokeros/int-mail-constant-contact', () => ({
  ConstantContactAdapter: jest
    .fn()
    .mockImplementation(() => mockAdapterInstance),
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailIntegrationsService } from './email-integrations.service.js';

describe('EmailIntegrationsService', () => {
  let service: EmailIntegrationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      marketingIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      marketingSenderDomain: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      campaignSenderPool: {
        count: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
    };

    service = new EmailIntegrationsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdapter', () => {
    it('should return matching adapter for each provider type', () => {
      expect(service.getAdapter('SENDGRID')).toBeDefined();
      expect(service.getAdapter('BREVO')).toBeDefined();
      expect(service.getAdapter('MAILCHIMP')).toBeDefined();
      expect(service.getAdapter('MAILGUN')).toBeDefined();
      expect(service.getAdapter('GMAIL')).toBeDefined();
      expect(service.getAdapter('OUTLOOK')).toBeDefined();
      expect(service.getAdapter('CONSTANT_CONTACT')).toBeDefined();
      expect(service.getAdapter('AWS_SES')).toBeDefined();
      expect(service.getAdapter('UNKNOWN')).toBeDefined(); // defaults to SES
    });
  });

  describe('renderMergeTags', () => {
    it('should replace all placeholders with data', () => {
      const template =
        'Hello {{lead.firstName}} {{lead.lastName}}, check {{project.name}} in {{project.location}} starting at {{project.startingPrice}}. Contact {{agent.name}} at {{agent.phone}}. Unsubscribe: {{unsubscribeUrl}}';
      const rendered = service.renderMergeTags(template, {
        firstName: 'Rahul',
        lastName: 'Sharma',
        projectName: 'Skyline Heights',
        projectLocation: 'Worli',
        projectStartingPrice: '₹3 Cr',
        agentName: 'Vikram',
        agentPhone: '+919876543210',
        unsubscribeUrl: 'https://example.com/unsub',
      });

      expect(rendered).toContain('Rahul Sharma');
      expect(rendered).toContain('Skyline Heights in Worli');
      expect(rendered).toContain('starting at ₹3 Cr');
      expect(rendered).toContain('Vikram at +919876543210');
      expect(rendered).toContain('https://example.com/unsub');
    });

    it('should return empty string if template is empty', () => {
      expect(service.renderMergeTags('', {})).toBe('');
    });
  });

  describe('sendTestEmail', () => {
    it('should throw BadRequestException if recipient email is invalid', async () => {
      await expect(
        service.sendTestEmail({
          recipientEmail: 'invalid-email',
          subject: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send test email with rendered tags', async () => {
      mockPrisma.marketingIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
        provider: 'AWS_SES',
        fromEmail: 'sales@skyline.com',
        fromName: 'Skyline Sales',
      });

      const res = await service.sendTestEmail({
        integrationId: 'int-1',
        recipientEmail: 'client@example.com',
        subject: 'Welcome to {{project.name}}',
        htmlContent: '<p>Hi {{lead.firstName}}</p>',
      });

      expect(res.success).toBe(true);
      expect(mockAdapterInstance.sendBatch).toHaveBeenCalled();
    });
  });

  describe('connectIntegration', () => {
    it('should throw BadRequestException if credential validation fails', async () => {
      mockAdapterInstance.validateCredentials.mockResolvedValueOnce(false);

      await expect(
        service.connectIntegration({
          provider: 'SENDGRID',
          apiKey: 'invalid-key',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save integration and sync domains on valid credentials', async () => {
      mockAdapterInstance.validateCredentials.mockResolvedValueOnce(true);
      mockPrisma.marketingIntegration.create.mockResolvedValue({
        id: 'int-new',
        provider: 'SENDGRID',
        fromEmail: 'team@realty.com',
      });
      mockPrisma.marketingIntegration.findUnique.mockResolvedValue({
        id: 'int-new',
        provider: 'SENDGRID',
        fromEmail: 'team@realty.com',
        senderDomains: [],
      });
      mockPrisma.marketingSenderDomain.findFirst.mockResolvedValue(null);
      mockPrisma.marketingSenderDomain.create.mockResolvedValue({ id: 'sd-1' });

      const res = await service.connectIntegration({
        provider: 'SENDGRID',
        apiKey: 'sg.valid-key',
        isDefault: true,
      } as any);

      expect(mockPrisma.marketingIntegration.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      expect(res).toBeDefined();
    });
  });

  describe('addSenderDomain', () => {
    it('should throw NotFoundException if integration does not exist', async () => {
      mockPrisma.marketingIntegration.findUnique.mockResolvedValue(null);

      await expect(
        service.addSenderDomain('int-none', { fromEmail: 'sales@domain.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid email or duplicate domain', async () => {
      mockPrisma.marketingIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
      });

      await expect(
        service.addSenderDomain('int-1', { fromEmail: 'bad-email' }),
      ).rejects.toThrow(BadRequestException);

      mockPrisma.marketingSenderDomain.findFirst.mockResolvedValue({
        id: 'sd-dup',
      });

      await expect(
        service.addSenderDomain('int-1', { fromEmail: 'sales@domain.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create sender domain after verification', async () => {
      mockPrisma.marketingIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
        provider: 'AWS_SES',
      });
      mockPrisma.marketingSenderDomain.findFirst.mockResolvedValue(null);
      mockPrisma.marketingSenderDomain.create.mockResolvedValue({
        id: 'sd-new',
        fromEmail: 'sales@domain.com',
      });

      const res = await service.addSenderDomain('int-1', {
        fromEmail: 'sales@domain.com',
        domain: 'domain.com',
      });

      expect(res.id).toBe('sd-new');
    });
  });

  describe('deleteSenderDomain', () => {
    it('should throw BadRequestException if active campaigns are using the domain', async () => {
      mockPrisma.marketingSenderDomain.findUnique.mockResolvedValue({
        id: 'sd-1',
      });
      mockPrisma.campaignSenderPool.count.mockResolvedValue(2);

      await expect(service.deleteSenderDomain('sd-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete domain when not in use', async () => {
      mockPrisma.marketingSenderDomain.findUnique.mockResolvedValue({
        id: 'sd-1',
      });
      mockPrisma.campaignSenderPool.count.mockResolvedValue(0);
      mockPrisma.marketingSenderDomain.delete.mockResolvedValue({ id: 'sd-1' });

      const res = await service.deleteSenderDomain('sd-1');
      expect(res.id).toBe('sd-1');
    });
  });
});
