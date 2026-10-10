import { WhatsAppAutomationsController } from './whatsapp-automations.controller.js';

describe('WhatsAppAutomationsController', () => {
  let controller: WhatsAppAutomationsController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listAutomations: jest.fn(),
      createAutomation: jest.fn(),
      getAutomation: jest.fn(),
      updateAutomation: jest.fn(),
      deleteAutomation: jest.fn(),
      toggleAutomation: jest.fn(),
      getLogs: jest.fn(),
    };

    controller = new WhatsAppAutomationsController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listAutomations', async () => {
    mockService.listAutomations.mockResolvedValue({ items: [] });

    const res = await controller.listAutomations({});
    expect(mockService.listAutomations).toHaveBeenCalledWith({});
    expect(res).toEqual({ items: [] });
  });

  it('should call createAutomation', async () => {
    const dto: any = { name: 'Flow 1', triggerType: 'keyword' };
    mockService.createAutomation.mockResolvedValue({ id: 'auto-1' });

    const res = await controller.createAutomation(dto, { user: { id: 'u-1' } });
    expect(mockService.createAutomation).toHaveBeenCalledWith(dto, 'u-1');
    expect(res).toEqual({ id: 'auto-1' });
  });

  it('should call getAutomation', async () => {
    mockService.getAutomation.mockResolvedValue({ id: 'auto-1' });

    const res = await controller.getAutomation('auto-1');
    expect(mockService.getAutomation).toHaveBeenCalledWith('auto-1');
    expect(res).toEqual({ id: 'auto-1' });
  });

  it('should call updateAutomation', async () => {
    const dto: any = { name: 'Updated' };
    mockService.updateAutomation.mockResolvedValue({ id: 'auto-1' });

    const res = await controller.updateAutomation('auto-1', dto);
    expect(mockService.updateAutomation).toHaveBeenCalledWith('auto-1', dto);
    expect(res).toEqual({ id: 'auto-1' });
  });

  it('should call deleteAutomation', async () => {
    mockService.deleteAutomation.mockResolvedValue({ success: true });

    const res = await controller.deleteAutomation('auto-1');
    expect(mockService.deleteAutomation).toHaveBeenCalledWith('auto-1');
    expect(res).toEqual({ success: true });
  });

  it('should call toggleAutomation', async () => {
    mockService.toggleAutomation.mockResolvedValue({ id: 'auto-1', isActive: false });

    const res = await controller.toggleAutomation('auto-1', false);
    expect(mockService.toggleAutomation).toHaveBeenCalledWith('auto-1', false);
    expect(res.isActive).toBe(false);
  });

  it('should call getLogs', async () => {
    mockService.getLogs.mockResolvedValue({ items: [] });

    const res = await controller.getLogs('auto-1', {});
    expect(mockService.getLogs).toHaveBeenCalledWith('auto-1', {});
    expect(res).toEqual({ items: [] });
  });
});
