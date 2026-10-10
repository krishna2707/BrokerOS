jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { EmailInboundService } from './email-inbound.service.js';

describe('EmailInboundService', () => {
  let service: EmailInboundService;
  let mockPrisma: any;
  let mockAutomationEngine: any;
  let mockAiService: any;

  beforeEach(() => {
    mockPrisma = {
      campaignRecipient: {
        findFirst: jest.fn(),
      },
      emailInboundMessage: {
        create: jest.fn().mockResolvedValue({ id: 'inbound-1' }),
      },
      emailConversation: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'conv-1' }),
        update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      },
      emailMessage: {
        create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      },
    };

    mockAutomationEngine = {
      processInboundReply: jest.fn().mockResolvedValue({
        actionsExecuted: ['Auto reply dispatched'],
        outboundReply: 'Hello, here is your brochure.',
        matchedFlowId: 'flow-1',
        flowName: 'Brochure Flow',
      }),
    };

    mockAiService = {
      generateAutoreply: jest.fn(),
    };

    service = new EmailInboundService(
      mockPrisma,
      mockAutomationEngine,
      mockAiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleInboundEmail', () => {
    it('should process inbound email, sync to team inbox and run automation', async () => {
      mockPrisma.campaignRecipient.findFirst.mockResolvedValue({
        id: 'rec-1',
        name: 'Rajesh Kumar',
        campaignId: 'camp-1',
        leadId: 'lead-1',
        assignedProvider: 'AWS_SES',
        assignedSenderEmail: 'sales@skyline.com',
        campaign: { title: 'Skyline Launch', fromName: 'Skyline Team' },
        lead: { firstName: 'Rajesh', lastName: 'Kumar' },
      });

      mockPrisma.emailConversation.findFirst.mockResolvedValue(null);

      const result = await service.handleInboundEmail({
        from: 'Rajesh <rajesh@example.com>',
        to: 'sales@skyline.com',
        subject: 'Inquiry on 3BHK',
        text: 'Can I see the layout?',
        provider: 'AWS_SES',
        messageId: 'msg-in-1',
      });

      expect(mockPrisma.emailInboundMessage.create).toHaveBeenCalled();
      expect(mockPrisma.emailConversation.create).toHaveBeenCalled();
      expect(mockPrisma.emailMessage.create).toHaveBeenCalled();
      expect(mockAutomationEngine.processInboundReply).toHaveBeenCalled();
      expect(result.status).toBe('ok');
      expect(result.inboundId).toBe('inbound-1');
      expect(result.matchedRecipientId).toBe('rec-1');
    });

    it('should update existing conversation if found', async () => {
      mockPrisma.campaignRecipient.findFirst.mockResolvedValue(null);
      mockPrisma.emailConversation.findFirst.mockResolvedValue({
        id: 'conv-existing',
        assignedProvider: 'AWS_SES',
      });

      const result = await service.handleInboundEmail({
        from: 'client@example.com',
        to: 'sales@skyline.com',
        subject: 'Re: Inquiry',
        text: 'Thanks',
        provider: 'UNIVERSAL',
      });

      expect(mockPrisma.emailConversation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'conv-existing' } }),
      );
      expect(result.status).toBe('ok');
    });
  });

  describe('Provider Inbound Parsers', () => {
    beforeEach(() => {
      jest
        .spyOn(service, 'handleInboundEmail')
        .mockResolvedValue({ status: 'ok' } as any);
    });

    it('should parse SendGrid inbound webhook payload', async () => {
      await service.parseSendgridInbound({
        from: 'sender@sendgrid.com',
        to: 'sales@skyline.com',
        subject: 'SendGrid email',
        text: 'Text body',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'SENDGRID' }),
      );
    });

    it('should parse AWS SES inbound payload', async () => {
      await service.parseSesInbound({
        mail: {
          source: 'ses-sender@example.com',
          destination: ['ses-dest@skyline.com'],
          commonHeaders: { subject: 'SES email' },
          messageId: 'ses-123',
        },
        content: 'SES content',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'AWS_SES' }),
      );
    });

    it('should parse Brevo inbound payload', async () => {
      await service.parseBrevoInbound({
        from: { email: 'brevo@example.com' },
        to: [{ email: 'sales@skyline.com' }],
        subject: 'Brevo Subject',
        text: 'Brevo body',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'BREVO' }),
      );
    });

    it('should parse Mailchimp inbound payload', async () => {
      await service.parseMailchimpInbound({
        mandrill_events: JSON.stringify([
          {
            msg: {
              from_email: 'chimp@example.com',
              email: 'sales@skyline.com',
              subject: 'Mailchimp Subject',
              text: 'Mailchimp body',
            },
          },
        ]),
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'MAILCHIMP' }),
      );
    });

    it('should parse Mailgun inbound payload', async () => {
      await service.parseMailgunInbound({
        from: 'gun@example.com',
        recipient: 'sales@skyline.com',
        subject: 'Mailgun Subject',
        'body-plain': 'Mailgun text',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'MAILGUN' }),
      );
    });

    it('should parse Gmail webhook payload', async () => {
      await service.parseGmailInbound({
        from: 'user@gmail.com',
        to: 'sales@skyline.com',
        subject: 'Gmail Subject',
        snippet: 'Gmail snippet',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'GMAIL' }),
      );
    });

    it('should parse Outlook webhook payload', async () => {
      await service.parseOutlookInbound({
        from: { emailAddress: { address: 'user@outlook.com' } },
        toRecipients: [{ emailAddress: { address: 'sales@skyline.com' } }],
        subject: 'Outlook Subject',
        body: { content: 'Outlook body' },
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'OUTLOOK' }),
      );
    });

    it('should parse Constant Contact inbound payload', async () => {
      await service.parseConstantContactInbound({
        contact_email: 'cc@example.com',
        to: 'sales@skyline.com',
        subject: 'CC Subject',
        text: 'CC body',
      });
      expect(service.handleInboundEmail).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'CONSTANT_CONTACT' }),
      );
    });
  });

  describe('simulateInboundReply', () => {
    it('should run simulation through automation engine', async () => {
      mockAutomationEngine.processInboundReply.mockResolvedValue({
        matchedFlowId: 'flow-test',
        flowName: 'Test Flow',
        triggerMatched: true,
        actionsExecuted: ['Action 1'],
        outboundReply: 'Simulated reply text',
        renderedSubject: 'Re: Test',
        renderedBody: 'Simulated reply body',
      });

      const res = await service.simulateInboundReply({
        leadEmail: 'tester@example.com',
        senderEmail: 'sales@skyline.com',
        subject: 'Simulated inquiry',
        bodyText: 'Price of 2BHK?',
      });

      expect(res.status).toBe('ok');
      expect(res.matchedFlowId).toBe('flow-test');
      expect(res.outboundReply).toBe('Simulated reply text');
    });
  });
});
