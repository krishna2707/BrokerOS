import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { EmailInboundController } from './email-inbound.controller.js';
import { EmailInboundService } from '../services/email-inbound.service.js';

describe('EmailInboundController', () => {
  let controller: EmailInboundController;
  let inboundService: jest.Mocked<Partial<EmailInboundService>>;

  beforeEach(async () => {
    inboundService = {
      handleInboundEmail: jest.fn().mockResolvedValue({ ok: true }),
      parseSendgridInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseSesInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseBrevoInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseMailchimpInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseMailgunInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseGmailInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseOutlookInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseConstantContactInbound: jest.fn().mockResolvedValue({ ok: true }),
      simulateInboundReply: jest.fn().mockResolvedValue({ simulated: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailInboundController],
      providers: [{ provide: EmailInboundService, useValue: inboundService }],
    }).compile();

    controller = module.get<EmailInboundController>(EmailInboundController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('handleUniversalInbound ? delegates to inboundService.handleInboundEmail with merged headers', async () => {
    const dto = { from: 'a@b.com', subject: 'Hi' } as any;
    const headers = { 'content-type': 'application/json' };
    const res = await controller.handleUniversalInbound(dto, headers);
    expect(inboundService.handleInboundEmail).toHaveBeenCalledWith({
      ...dto,
      headers,
    });
    expect(res).toEqual({ ok: true });
  });

  it('handleSendgridInbound ? delegates to parseSendgridInbound', async () => {
    await controller.handleSendgridInbound({ to: 'team@x.com' }, {});
    expect(inboundService.parseSendgridInbound).toHaveBeenCalled();
  });

  it('handleSesInbound ? delegates to parseSesInbound', async () => {
    await controller.handleSesInbound({}, {});
    expect(inboundService.parseSesInbound).toHaveBeenCalled();
  });

  it('handleBrevoInbound ? delegates to parseBrevoInbound', async () => {
    await controller.handleBrevoInbound({}, {});
    expect(inboundService.parseBrevoInbound).toHaveBeenCalled();
  });

  it('handleMailchimpInbound ? delegates to parseMailchimpInbound', async () => {
    await controller.handleMailchimpInbound({}, {});
    expect(inboundService.parseMailchimpInbound).toHaveBeenCalled();
  });

  it('handleMailgunInbound ? delegates to parseMailgunInbound', async () => {
    await controller.handleMailgunInbound({}, {});
    expect(inboundService.parseMailgunInbound).toHaveBeenCalled();
  });

  it('handleGmailInbound ? delegates to parseGmailInbound', async () => {
    await controller.handleGmailInbound({}, {});
    expect(inboundService.parseGmailInbound).toHaveBeenCalled();
  });

  it('handleOutlookInbound ? delegates to parseOutlookInbound', async () => {
    await controller.handleOutlookInbound({}, {});
    expect(inboundService.parseOutlookInbound).toHaveBeenCalled();
  });

  it('handleConstantContactInbound ? delegates to parseConstantContactInbound', async () => {
    await controller.handleConstantContactInbound({}, {});
    expect(inboundService.parseConstantContactInbound).toHaveBeenCalled();
  });

  it('simulateReply ? delegates to simulateInboundReply', async () => {
    const dto = { leadEmail: 'a@b.com', flowId: 'f-1' } as any;
    const res = await controller.simulateReply(dto);
    expect(inboundService.simulateInboundReply).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ simulated: true });
  });
});
