import { WhatsAppConfigController } from './whatsapp-config.controller.js';

describe('WhatsAppConfigController', () => {
  let controller: WhatsAppConfigController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getConfig: jest.fn(),
      listAccounts: jest.fn(),
      connectAccount: jest.fn(),
      updateAccount: jest.fn(),
      disconnectAccount: jest.fn(),
    };

    controller = new WhatsAppConfigController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getConfig on getCurrentConfig', async () => {
    mockService.getConfig.mockResolvedValue({ id: 'acc-1' });

    const res = await controller.getCurrentConfig();
    expect(mockService.getConfig).toHaveBeenCalled();
    expect(res).toEqual({ id: 'acc-1' });
  });

  it('should call listAccounts on listAccounts', async () => {
    mockService.listAccounts.mockResolvedValue([{ id: 'acc-1' }]);

    const res = await controller.listAccounts();
    expect(mockService.listAccounts).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'acc-1' }]);
  });

  it('should call connectAccount on connectAccount', async () => {
    const dto = {
      phoneNumberId: 'phone-1',
      wabaId: 'waba-1',
      accessToken: 'token-1',
    };
    mockService.connectAccount.mockResolvedValue({ id: 'acc-1' });

    const res = await controller.connectAccount(dto);
    expect(mockService.connectAccount).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'acc-1' });
  });

  it('should call updateAccount on updateAccount', async () => {
    const dto = { businessName: 'Updated' };
    mockService.updateAccount.mockResolvedValue({ id: 'acc-1', businessName: 'Updated' });

    const res = await controller.updateAccount('acc-1', dto);
    expect(mockService.updateAccount).toHaveBeenCalledWith('acc-1', dto);
    expect(res).toEqual({ id: 'acc-1', businessName: 'Updated' });
  });

  it('should call disconnectAccount on disconnectAccount', async () => {
    mockService.disconnectAccount.mockResolvedValue({ success: true });

    const res = await controller.disconnectAccount('acc-1');
    expect(mockService.disconnectAccount).toHaveBeenCalledWith('acc-1');
    expect(res).toEqual({ success: true });
  });
});
