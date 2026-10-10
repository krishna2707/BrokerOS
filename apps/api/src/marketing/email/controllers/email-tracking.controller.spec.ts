import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { EmailTrackingController } from './email-tracking.controller.js';
import { EmailService } from '../email.service.js';

describe('EmailTrackingController', () => {
  let controller: EmailTrackingController;
  let emailService: jest.Mocked<Partial<EmailService>>;

  beforeEach(async () => {
    emailService = {
      recordOpenEvent: jest.fn().mockResolvedValue({}),
      recordClickEvent: jest.fn().mockResolvedValue({}),
      recordUnsubscribe: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailTrackingController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get<EmailTrackingController>(EmailTrackingController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('trackOpen ? records open event and sends 1x1 gif', async () => {
    const mockRes = { setHeader: jest.fn(), send: jest.fn() } as any;
    const mockReq = {
      headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'Mozilla' },
      socket: { remoteAddress: '1.2.3.4' },
    } as any;
    await controller.trackOpen('camp-1', 'rec-1', mockReq, mockRes);
    expect(emailService.recordOpenEvent).toHaveBeenCalledWith(
      'camp-1',
      'rec-1',
      '1.2.3.4',
      'Mozilla',
    );
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('trackOpen ? skips recording when no ids provided', async () => {
    const mockRes = { setHeader: jest.fn(), send: jest.fn() } as any;
    const mockReq = { headers: {}, socket: {} } as any;
    await controller.trackOpen(
      undefined as any,
      undefined as any,
      mockReq,
      mockRes,
    );
    expect(emailService.recordOpenEvent).not.toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('trackClick ? records click event and redirects', async () => {
    const mockRes = { redirect: jest.fn() } as any;
    const mockReq = {
      headers: {},
      socket: { remoteAddress: '1.1.1.1' },
    } as any;
    await controller.trackClick(
      'camp-1',
      'rec-1',
      'https://example.com',
      mockReq,
      mockRes,
    );
    expect(emailService.recordClickEvent).toHaveBeenCalledWith(
      'camp-1',
      'rec-1',
      'https://example.com',
      '1.1.1.1',
      undefined,
    );
    expect(mockRes.redirect).toHaveBeenCalledWith(302, 'https://example.com');
  });

  it('unsubscribe ? records unsubscribe and sends HTML page', async () => {
    const mockRes = { setHeader: jest.fn(), send: jest.fn() } as any;
    await controller.unsubscribe('test@x.com', 'camp-1', mockRes);
    expect(emailService.recordUnsubscribe).toHaveBeenCalledWith(
      'test@x.com',
      'camp-1',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
  });
});
