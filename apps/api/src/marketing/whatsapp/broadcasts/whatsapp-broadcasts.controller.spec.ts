import { WhatsAppBroadcastsController } from './whatsapp-broadcasts.controller.js';

describe('WhatsAppBroadcastsController', () => {
  let controller: WhatsAppBroadcastsController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listBroadcasts: jest.fn(),
      createBroadcast: jest.fn(),
      getProjects: jest.fn(),
      previewAudience: jest.fn(),
      getBroadcast: jest.fn(),
      deleteBroadcast: jest.fn(),
      getRecipients: jest.fn(),
      scheduleBroadcast: jest.fn(),
      dispatchNow: jest.fn(),
      cancelBroadcast: jest.fn(),
    };

    controller = new WhatsAppBroadcastsController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listBroadcasts', async () => {
    mockService.listBroadcasts.mockResolvedValue({ items: [] });

    const res = await controller.listBroadcasts({});
    expect(mockService.listBroadcasts).toHaveBeenCalledWith({});
    expect(res).toEqual({ items: [] });
  });

  it('should call createBroadcast with userId', async () => {
    const dto: any = { name: 'Promo 1', templateName: 't1' };
    mockService.createBroadcast.mockResolvedValue({ id: 'bc-1' });

    const res = await controller.createBroadcast(dto, { user: { id: 'u-1' } });
    expect(mockService.createBroadcast).toHaveBeenCalledWith(dto, 'u-1');
    expect(res).toEqual({ id: 'bc-1' });
  });

  it('should call getProjects', async () => {
    mockService.getProjects.mockResolvedValue([{ id: 'p-1' }]);

    const res = await controller.getProjects();
    expect(mockService.getProjects).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'p-1' }]);
  });

  it('should call previewAudience', async () => {
    mockService.previewAudience.mockResolvedValue({ totalCount: 50 });

    const res = await controller.previewAudience({ audienceSource: 'CRM' });
    expect(mockService.previewAudience).toHaveBeenCalledWith({ audienceSource: 'CRM' });
    expect(res).toEqual({ totalCount: 50 });
  });

  it('should call getBroadcast', async () => {
    mockService.getBroadcast.mockResolvedValue({ id: 'bc-1' });

    const res = await controller.getBroadcast('bc-1');
    expect(mockService.getBroadcast).toHaveBeenCalledWith('bc-1');
    expect(res).toEqual({ id: 'bc-1' });
  });

  it('should call deleteBroadcast', async () => {
    mockService.deleteBroadcast.mockResolvedValue({ success: true });

    const res = await controller.deleteBroadcast('bc-1');
    expect(mockService.deleteBroadcast).toHaveBeenCalledWith('bc-1');
    expect(res).toEqual({ success: true });
  });

  it('should call getRecipients', async () => {
    mockService.getRecipients.mockResolvedValue({ items: [] });

    const res = await controller.getRecipients('bc-1', { page: '1' });
    expect(mockService.getRecipients).toHaveBeenCalledWith('bc-1', { page: '1' });
    expect(res).toEqual({ items: [] });
  });

  it('should call scheduleBroadcast', async () => {
    const dto: any = { scheduledAt: '2026-03-01T00:00:00.000Z' };
    mockService.scheduleBroadcast.mockResolvedValue({ id: 'bc-1', status: 'SCHEDULED' });

    const res = await controller.scheduleBroadcast('bc-1', dto);
    expect(mockService.scheduleBroadcast).toHaveBeenCalledWith('bc-1', dto);
    expect(res.status).toBe('SCHEDULED');
  });

  it('should call dispatchNow', async () => {
    mockService.dispatchNow.mockResolvedValue({ id: 'bc-1', status: 'SCHEDULED' });

    const res = await controller.dispatchNow('bc-1');
    expect(mockService.dispatchNow).toHaveBeenCalledWith('bc-1');
    expect(res.status).toBe('SCHEDULED');
  });

  it('should call cancelBroadcast', async () => {
    mockService.cancelBroadcast.mockResolvedValue({ id: 'bc-1', status: 'CANCELLED' });

    const res = await controller.cancelBroadcast('bc-1');
    expect(mockService.cancelBroadcast).toHaveBeenCalledWith('bc-1');
    expect(res.status).toBe('CANCELLED');
  });
});
