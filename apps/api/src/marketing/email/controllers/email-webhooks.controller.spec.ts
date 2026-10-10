import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));
jest.mock('@brokeros/int-mail-ses', () => ({
  SesWebhookParser: { parse: jest.fn().mockReturnValue([{ type: 'BOUNCE' }]) },
}));
jest.mock('@brokeros/int-mail-sendgrid', () => ({
  SendgridWebhookParser: {
    parse: jest.fn().mockReturnValue([{ type: 'OPEN' }]),
  },
}));
jest.mock('@brokeros/int-mail-brevo', () => ({
  BrevoWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-mail-mailchimp', () => ({
  MailchimpWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-mail-mailgun', () => ({
  MailgunWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-mail-gmail', () => ({
  GmailWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-mail-outlook', () => ({
  OutlookWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-mail-constant-contact', () => ({
  ConstantContactWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));

import { EmailWebhooksController } from './email-webhooks.controller.js';
import { EmailService } from '../email.service.js';

describe('EmailWebhooksController', () => {
  let controller: EmailWebhooksController;
  let emailService: jest.Mocked<Partial<EmailService>>;

  beforeEach(async () => {
    emailService = {
      processWebhookEvents: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailWebhooksController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get<EmailWebhooksController>(EmailWebhooksController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('handleSesWebhook ? parses events and calls processWebhookEvents', async () => {
    const res = await controller.handleSesWebhook({}, {});
    expect(emailService.processWebhookEvents).toHaveBeenCalledWith([
      { type: 'BOUNCE' },
    ]);
    expect(res).toEqual({ status: 'ok', processed: 1 });
  });

  it('handleSendgridWebhook ? parses events and calls processWebhookEvents', async () => {
    const res = await controller.handleSendgridWebhook({}, {});
    expect(emailService.processWebhookEvents).toHaveBeenCalledWith([
      { type: 'OPEN' },
    ]);
    expect(res).toEqual({ status: 'ok', processed: 1 });
  });

  it('handleBrevoWebhook ? empty events, skips processWebhookEvents', async () => {
    const res = await controller.handleBrevoWebhook({}, {});
    expect(emailService.processWebhookEvents).not.toHaveBeenCalled();
    expect(res).toEqual({ status: 'ok', processed: 0 });
  });

  it('handleMailchimpWebhook ? empty events', async () => {
    const res = await controller.handleMailchimpWebhook({}, {});
    expect(res.processed).toBe(0);
  });

  it('handleMailgunWebhook ? empty events', async () => {
    const res = await controller.handleMailgunWebhook({}, {});
    expect(res.processed).toBe(0);
  });

  it('handleGmailWebhook ? empty events', async () => {
    const res = await controller.handleGmailWebhook({}, {});
    expect(res.processed).toBe(0);
  });

  it('handleOutlookWebhook ? empty events', async () => {
    const res = await controller.handleOutlookWebhook({}, {});
    expect(res.processed).toBe(0);
  });

  it('handleConstantContactWebhook ? empty events', async () => {
    const res = await controller.handleConstantContactWebhook({}, {});
    expect(res.processed).toBe(0);
  });
});
