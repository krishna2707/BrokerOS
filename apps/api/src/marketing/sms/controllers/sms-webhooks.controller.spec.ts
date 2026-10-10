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
    parse: jest.fn().mockReturnValue([{ type: 'DELIVERED' }]),
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

import { SmsWebhooksController } from './sms-webhooks.controller.js';
import { SmsService } from '../sms.service.js';

describe('SmsWebhooksController', () => {
  let controller: SmsWebhooksController;
  let smsService: jest.Mocked<Partial<SmsService>>;

  beforeEach(async () => {
    smsService = { processWebhookEvents: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsWebhooksController],
      providers: [{ provide: SmsService, useValue: smsService }],
    }).compile();

    controller = module.get<SmsWebhooksController>(SmsWebhooksController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('handleTwilioWebhook ? processes 1 parsed event', async () => {
    const res = await controller.handleTwilioWebhook({}, {});
    expect(smsService.processWebhookEvents).toHaveBeenCalledWith([
      { type: 'DELIVERED' },
    ]);
    expect(res).toEqual({ received: true, count: 1 });
  });

  it('handleAwsSnsWebhook ? empty events, skips processing', async () => {
    const res = await controller.handleAwsSnsWebhook({}, {});
    expect(smsService.processWebhookEvents).not.toHaveBeenCalled();
    expect(res.count).toBe(0);
  });

  it.each([
    ['handleSinchWebhook'],
    ['handleGupshupWebhook'],
    ['handleInfobipWebhook'],
    ['handleVonageWebhook'],
    ['handleTelnyxWebhook'],
    ['handlePlivoWebhook'],
    ['handleBirdWebhook'],
  ])('%s ? returns received:true with count 0', async (method) => {
    const res = await (controller as any)[method]({}, {});
    expect(res).toEqual({ received: true, count: 0 });
    expect(smsService.processWebhookEvents).not.toHaveBeenCalled();
  });
});
