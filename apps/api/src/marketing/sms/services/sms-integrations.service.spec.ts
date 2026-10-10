jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

jest.mock('@brokeros/int-sms-twilio', () => ({
  TwilioSmsAdapter: class {
    sendBatch = jest
      .fn()
      .mockResolvedValue({ success: true, sentCount: 1, failedCount: 0 });
    validateCredentials = jest.fn().mockResolvedValue(true);
  },
}));
jest.mock('@brokeros/int-sms-aws-sns', () => ({
  AwsSnsSmsAdapter: class {
    sendBatch = jest.fn();
    validateCredentials = jest.fn();
  },
}));
jest.mock('@brokeros/int-sms-sinch', () => ({ SinchSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-gupshup', () => ({ GupshupSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-infobip', () => ({ InfobipSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-vonage', () => ({ VonageSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-telnyx', () => ({ TelnyxSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-plivo', () => ({ PlivoSmsAdapter: class {} }));
jest.mock('@brokeros/int-sms-bird', () => ({ BirdSmsAdapter: class {} }));

import { SmsIntegrationsService } from './sms-integrations.service.js';

describe('SmsIntegrationsService', () => {
  let service: SmsIntegrationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsIntegration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      smsSenderNumber: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      campaignSmsSenderPool: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    service = new SmsIntegrationsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdapter', () => {
    it('should return Twilio adapter for TWILIO and default', () => {
      const adapter = service.getAdapter('TWILIO');
      expect(adapter).toBeDefined();
      expect(service.getAdapter('UNKNOWN')).toBe(adapter);
    });

    it('should return AWS SNS adapter for AWS_SNS', () => {
      const adapter = service.getAdapter('AWS_SNS');
      expect(adapter).toBeDefined();
    });
  });

  describe('sendTestSms', () => {
    it('should dispatch test SMS through adapter with mapped credentials', async () => {
      mockPrisma.smsIntegration.findFirst.mockResolvedValue({
        id: 'int-1',
        provider: 'TWILIO',
        accountSid: 'AC123',
        authToken: 'secret',
        fromSender: '+1234567890',
        senderNumbers: [{ phoneNumber: '+1234567890', isVerified: true }],
      });

      const res = await service.sendTestSms({
        recipientPhone: '+919876543210',
        messageContent: 'Test message',
        providerType: 'TWILIO',
      });

      expect(res.success).toBe(true);
      expect(res.sentCount).toBe(1);
    });
  });

  describe('listIntegrations', () => {
    it('should list integrations with sender numbers', async () => {
      mockPrisma.smsIntegration.findMany.mockResolvedValue([
        {
          id: 'int-1',
          name: 'Twilio Production',
          provider: 'TWILIO',
          isActive: true,
          senderNumbers: [{ id: 's-1', isVerified: true }],
        },
      ]);

      const res = await service.listIntegrations();
      expect(res.length).toBe(1);
      expect(res[0].provider).toBe('TWILIO');
      expect(res[0].senderNumbers.length).toBe(1);
    });
  });

  describe('connectIntegration', () => {
    it('should verify credentials and save integration', async () => {
      mockPrisma.smsIntegration.create.mockResolvedValue({
        id: 'int-new',
        name: 'Twilio Main',
        provider: 'TWILIO',
      });
      mockPrisma.smsIntegration.findUnique.mockResolvedValue({
        id: 'int-new',
        name: 'Twilio Main',
        provider: 'TWILIO',
        senderNumbers: [],
      });

      const res = await service.connectIntegration({
        name: 'Twilio Main',
        provider: 'TWILIO',
        accountSid: 'AC123',
        authToken: 'token123',
        fromSender: '+1234567890',
      });

      expect(mockPrisma.smsIntegration.create).toHaveBeenCalled();
      expect(res?.id).toBe('int-new');
    });
  });

  describe('deleteIntegration', () => {
    it('should delete integration by id', async () => {
      mockPrisma.smsIntegration.delete.mockResolvedValue({ id: 'int-1' });

      await service.deleteIntegration('int-1');
      expect(mockPrisma.smsIntegration.delete).toHaveBeenCalledWith({
        where: { id: 'int-1' },
      });
    });
  });
});
