import { WhatsAppFlowsController } from './whatsapp-flows.controller.js';

describe('WhatsAppFlowsController', () => {
  let controller: WhatsAppFlowsController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listFlows: jest.fn(),
      createFlow: jest.fn(),
      getFlow: jest.fn(),
      updateFlow: jest.fn(),
      deleteFlow: jest.fn(),
      toggleFlow: jest.fn(),
      getFlowRuns: jest.fn(),
    };

    controller = new WhatsAppFlowsController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listFlows', async () => {
    mockService.listFlows.mockResolvedValue({ items: [] });

    const res = await controller.listFlows({});
    expect(mockService.listFlows).toHaveBeenCalledWith({});
    expect(res).toEqual({ items: [] });
  });

  it('should call createFlow', async () => {
    const dto: any = { name: 'Bot', triggerType: 'keyword' };
    mockService.createFlow.mockResolvedValue({ id: 'flow-1' });

    const res = await controller.createFlow(dto);
    expect(mockService.createFlow).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'flow-1' });
  });

  it('should call getFlow', async () => {
    mockService.getFlow.mockResolvedValue({ id: 'flow-1' });

    const res = await controller.getFlow('flow-1');
    expect(mockService.getFlow).toHaveBeenCalledWith('flow-1');
    expect(res).toEqual({ id: 'flow-1' });
  });

  it('should call updateFlow', async () => {
    const dto: any = { name: 'Updated' };
    mockService.updateFlow.mockResolvedValue({ id: 'flow-1' });

    const res = await controller.updateFlow('flow-1', dto);
    expect(mockService.updateFlow).toHaveBeenCalledWith('flow-1', dto);
    expect(res).toEqual({ id: 'flow-1' });
  });

  it('should call toggleFlow', async () => {
    mockService.toggleFlow.mockResolvedValue({ id: 'flow-1', status: 'active' });

    const res = await controller.toggleFlow('flow-1', 'active');
    expect(mockService.toggleFlow).toHaveBeenCalledWith('flow-1', 'active');
    expect(res.status).toBe('active');
  });

  it('should call deleteFlow', async () => {
    mockService.deleteFlow.mockResolvedValue({ success: true });

    const res = await controller.deleteFlow('flow-1');
    expect(mockService.deleteFlow).toHaveBeenCalledWith('flow-1');
    expect(res).toEqual({ success: true });
  });

  it('should call getFlowRuns', async () => {
    mockService.getFlowRuns.mockResolvedValue({ items: [] });

    const res = await controller.getFlowRuns('flow-1', {});
    expect(mockService.getFlowRuns).toHaveBeenCalledWith('flow-1', {});
    expect(res).toEqual({ items: [] });
  });
});
