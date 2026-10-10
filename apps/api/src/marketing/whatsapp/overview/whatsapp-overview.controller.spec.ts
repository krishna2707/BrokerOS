import { WhatsAppOverviewController } from './whatsapp-overview.controller.js';

describe('WhatsAppOverviewController', () => {
  let controller: WhatsAppOverviewController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getOverviewStats: jest.fn(),
    };

    controller = new WhatsAppOverviewController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getOverviewStats with query param', async () => {
    mockService.getOverviewStats.mockResolvedValue({ connected: true });

    const res = await controller.getOverviewStats('acc-1');
    expect(mockService.getOverviewStats).toHaveBeenCalledWith('acc-1');
    expect(res).toEqual({ connected: true });
  });
});
