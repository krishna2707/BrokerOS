import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn(),
}));
import { SmsIntegrationsController } from './sms-integrations.controller.js';
import { SmsService } from '../sms.service.js';
describe('SmsIntegrationsController', () => {
  let controller: SmsIntegrationsController;
  let smsService: jest.Mocked<Partial<SmsService>>;
  beforeEach(async () => {
    smsService = {
      listIntegrations: jest.fn().mockResolvedValue([]),
      connectIntegration: jest.fn().mockResolvedValue({ id: 'int-1' }),
      deleteIntegration: jest.fn().mockResolvedValue({}),
      listAllActiveSenderNumbers: jest.fn().mockResolvedValue([]),
      syncNumbersForIntegration: jest.fn().mockResolvedValue({ synced: 2 }),
      addSenderNumber: jest.fn().mockResolvedValue({ id: 'num-1' }),
      updateSenderNumber: jest.fn().mockResolvedValue({ id: 'num-1' }),
      deleteSenderNumber: jest.fn().mockResolvedValue({}),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsIntegrationsController],
      providers: [{ provide: SmsService, useValue: smsService }],
    }).compile();
    controller = module.get<SmsIntegrationsController>(
      SmsIntegrationsController,
    );
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('list', async () => {
    await controller.list();
    expect(smsService.listIntegrations).toHaveBeenCalled();
  });
  it('connect', async () => {
    await controller.connect({ provider: 'TWILIO' } as any);
    expect(smsService.connectIntegration).toHaveBeenCalled();
  });
  it('delete', async () => {
    await controller.delete('int-1');
    expect(smsService.deleteIntegration).toHaveBeenCalledWith('int-1');
  });
  it('listNumbers', async () => {
    await controller.listNumbers();
    expect(smsService.listAllActiveSenderNumbers).toHaveBeenCalled();
  });
  it('syncNumbers', async () => {
    await controller.syncNumbers('int-1');
    expect(smsService.syncNumbersForIntegration).toHaveBeenCalledWith('int-1');
  });
  it('addNumber', async () => {
    await controller.addNumber('int-1', { number: '+91...' } as any);
    expect(smsService.addSenderNumber).toHaveBeenCalledWith('int-1', {
      number: '+91...',
    });
  });
  it('updateNumber', async () => {
    await controller.updateNumber('num-1', { isDefault: true } as any);
    expect(smsService.updateSenderNumber).toHaveBeenCalledWith('num-1', {
      isDefault: true,
    });
  });
  it('deleteNumber', async () => {
    await controller.deleteNumber('num-1');
    expect(smsService.deleteSenderNumber).toHaveBeenCalledWith('num-1');
  });
});
