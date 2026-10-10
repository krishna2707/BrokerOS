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
import { SmsTrackingController } from './sms-tracking.controller.js';
import { SmsService } from '../sms.service.js';
describe('SmsTrackingController', () => {
  let controller: SmsTrackingController;
  let smsService: jest.Mocked<Partial<SmsService>>;
  beforeEach(async () => {
    smsService = {
      resolveShortLink: jest.fn().mockResolvedValue('https://example.com/page'),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsTrackingController],
      providers: [{ provide: SmsService, useValue: smsService }],
    }).compile();
    controller = module.get<SmsTrackingController>(SmsTrackingController);
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('resolveShortLink ? records click and redirects to destination', async () => {
    const mockReq = {
      headers: { 'x-forwarded-for': '1.1.1.1', 'user-agent': 'Mozilla' },
      socket: { remoteAddress: '1.1.1.1' },
    } as any;
    const mockRes = { redirect: jest.fn() } as any;
    await controller.resolveShortLink('abc123', mockReq, mockRes);
    expect(smsService.resolveShortLink).toHaveBeenCalledWith(
      'abc123',
      '1.1.1.1',
      'Mozilla',
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(
      302,
      'https://example.com/page',
    );
  });
  it('trackSmsClick ? records click and redirects', async () => {
    const mockReq = {
      headers: {},
      socket: { remoteAddress: '2.2.2.2' },
    } as any;
    const mockRes = { redirect: jest.fn() } as any;
    await controller.trackSmsClick(
      'code123',
      'https://dest.com',
      mockReq,
      mockRes,
    );
    expect(smsService.resolveShortLink).toHaveBeenCalledWith(
      'code123',
      '2.2.2.2',
      undefined,
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(302, 'https://dest.com');
  });
  it('trackSmsClick ? uses fallback url when targetUrl missing', async () => {
    const mockReq = { headers: {}, socket: {} } as any;
    const mockRes = { redirect: jest.fn() } as any;
    await controller.trackSmsClick(
      undefined as any,
      undefined as any,
      mockReq,
      mockRes,
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(302, 'https://brokeros.io');
  });
});
