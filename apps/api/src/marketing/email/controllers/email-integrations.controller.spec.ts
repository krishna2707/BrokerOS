import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { EmailIntegrationsController } from './email-integrations.controller.js';
import { EmailService } from '../email.service.js';

describe('EmailIntegrationsController', () => {
  let controller: EmailIntegrationsController;
  let emailService: jest.Mocked<Partial<EmailService>>;

  beforeEach(async () => {
    emailService = {
      listIntegrations: jest.fn().mockResolvedValue([{ id: 'int-1' }]),
      connectIntegration: jest.fn().mockResolvedValue({ id: 'int-1' }),
      deleteIntegration: jest.fn().mockResolvedValue({ id: 'int-1' }),
      listAllActiveSenderDomains: jest.fn().mockResolvedValue([]),
      syncDomainsForIntegration: jest.fn().mockResolvedValue({ synced: 2 }),
      addSenderDomain: jest.fn().mockResolvedValue({ id: 'dom-1' }),
      updateSenderDomain: jest.fn().mockResolvedValue({ id: 'dom-1' }),
      deleteSenderDomain: jest.fn().mockResolvedValue({ id: 'dom-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailIntegrationsController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get<EmailIntegrationsController>(
      EmailIntegrationsController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  it('list ? returns integrations', async () => {
    const res = await controller.list();
    expect(emailService.listIntegrations).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'int-1' }]);
  });

  it('connect ? delegates dto', async () => {
    const dto = { provider: 'AWS_SES' } as any;
    const res = await controller.connect(dto);
    expect(emailService.connectIntegration).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'int-1' });
  });

  it('delete ? delegates id', async () => {
    await controller.delete('int-1');
    expect(emailService.deleteIntegration).toHaveBeenCalledWith('int-1');
  });

  it('listDomains ? returns domains', async () => {
    await controller.listDomains();
    expect(emailService.listAllActiveSenderDomains).toHaveBeenCalled();
  });

  it('syncDomains ? delegates id', async () => {
    await controller.syncDomains('int-1');
    expect(emailService.syncDomainsForIntegration).toHaveBeenCalledWith(
      'int-1',
    );
  });

  it('addDomain ? delegates id and dto', async () => {
    const dto = { domain: 'mail.example.com' } as any;
    await controller.addDomain('int-1', dto);
    expect(emailService.addSenderDomain).toHaveBeenCalledWith('int-1', dto);
  });

  it('updateDomain ? delegates domainId and dto', async () => {
    const dto = { isDefault: true } as any;
    await controller.updateDomain('dom-1', dto);
    expect(emailService.updateSenderDomain).toHaveBeenCalledWith('dom-1', dto);
  });

  it('deleteDomain ? delegates domainId', async () => {
    await controller.deleteDomain('dom-1');
    expect(emailService.deleteSenderDomain).toHaveBeenCalledWith('dom-1');
  });
});
