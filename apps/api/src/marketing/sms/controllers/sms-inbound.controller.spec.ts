import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn(),
}));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));
jest.mock('@brokeros/int-sms-twilio', () => ({
  TwilioSmsWebhookParser: {
    parse: jest.fn().mockReturnValue([{ from: '+1' }]),
  },
}));
jest.mock('@brokeros/int-sms-aws-sns', () => ({
  AwsSnsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-sinch', () => ({
  SinchSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-gupshup', () => ({
  GupshupWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-infobip', () => ({
  InfobipSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-vonage', () => ({
  VonageSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-telnyx', () => ({
  TelnyxSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-plivo', () => ({
  PlivoSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
jest.mock('@brokeros/int-sms-bird', () => ({
  BirdSmsWebhookParser: { parse: jest.fn().mockReturnValue([]) },
}));
import { SmsInboundController } from './sms-inbound.controller.js';
import { SmsInboundService } from '../services/sms-inbound.service.js';
describe('SmsInboundController', () => {
  let controller: SmsInboundController;
  let inboundService: any;
  beforeEach(async () => {
    inboundService = {
      handleInboundSms: jest.fn().mockResolvedValue({ ok: true }),
      parseTwilioInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseAwsSnsInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseSinchInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseGupshupInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseInfobipInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseVonageInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseTelnyxInbound: jest.fn().mockResolvedValue({ ok: true }),
      parsePlivoInbound: jest.fn().mockResolvedValue({ ok: true }),
      parseBirdInbound: jest.fn().mockResolvedValue({ ok: true }),
      simulateInboundReply: jest.fn().mockResolvedValue({ simulated: true }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsInboundController],
      providers: [{ provide: SmsInboundService, useValue: inboundService }],
    }).compile();
    controller = module.get<SmsInboundController>(SmsInboundController);
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('handleUniversalInbound ? delegates to inboundService.handleInboundSms', async () => {
    const dto = { from: '+91...', body: 'Hi' } as any;
    await controller.handleUniversalInbound(dto, {});
    expect(inboundService.handleInboundSms).toHaveBeenCalled();
  });
  it('simulateReply ? delegates to simulateInboundReply', async () => {
    const res = await controller.simulateReply({
      leadPhone: '+91...',
      flowId: 'f-1',
    } as any);
    expect(inboundService.simulateInboundReply).toHaveBeenCalled();
    expect(res).toEqual({ simulated: true });
  });
});
