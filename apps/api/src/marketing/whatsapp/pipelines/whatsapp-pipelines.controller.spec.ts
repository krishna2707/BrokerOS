import { WhatsAppPipelinesController } from './whatsapp-pipelines.controller.js';

describe('WhatsAppPipelinesController', () => {
  let controller: WhatsAppPipelinesController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listPipelines: jest.fn(),
      createPipeline: jest.fn(),
      getPipeline: jest.fn(),
      updatePipeline: jest.fn(),
      deletePipeline: jest.fn(),
      listDeals: jest.fn(),
      createDeal: jest.fn(),
      updateDeal: jest.fn(),
      deleteDeal: jest.fn(),
      addDealActivity: jest.fn(),
    };

    controller = new WhatsAppPipelinesController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listPipelines', async () => {
    mockService.listPipelines.mockResolvedValue({ pipelines: [] });

    const res = await controller.listPipelines('acc-1');
    expect(mockService.listPipelines).toHaveBeenCalledWith('acc-1');
    expect(res).toEqual({ pipelines: [] });
  });

  it('should call createPipeline', async () => {
    const dto: any = { name: 'VIP Pipeline' };
    mockService.createPipeline.mockResolvedValue({ id: 'p-1' });

    const res = await controller.createPipeline(dto);
    expect(mockService.createPipeline).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'p-1' });
  });

  it('should call getPipeline', async () => {
    mockService.getPipeline.mockResolvedValue({ id: 'p-1' });

    const res = await controller.getPipeline('p-1');
    expect(mockService.getPipeline).toHaveBeenCalledWith('p-1');
    expect(res).toEqual({ id: 'p-1' });
  });

  it('should call updatePipeline', async () => {
    const dto: any = { name: 'Updated' };
    mockService.updatePipeline.mockResolvedValue({ id: 'p-1' });

    const res = await controller.updatePipeline('p-1', dto);
    expect(mockService.updatePipeline).toHaveBeenCalledWith('p-1', dto);
    expect(res).toEqual({ id: 'p-1' });
  });

  it('should call deletePipeline', async () => {
    mockService.deletePipeline.mockResolvedValue({ success: true });

    const res = await controller.deletePipeline('p-1');
    expect(mockService.deletePipeline).toHaveBeenCalledWith('p-1');
    expect(res).toEqual({ success: true });
  });

  it('should call listDeals', async () => {
    mockService.listDeals.mockResolvedValue({ deals: [] });

    const res = await controller.listDeals('p-1');
    expect(mockService.listDeals).toHaveBeenCalledWith('p-1');
    expect(res).toEqual({ deals: [] });
  });

  it('should call createDeal with user id', async () => {
    const dto: any = { title: 'Deal 1', pipelineId: 'p-1', stageId: 's-1', contactId: 'c-1' };
    mockService.createDeal.mockResolvedValue({ id: 'd-1' });

    const res = await controller.createDeal(dto, { user: { id: 'u-1' } });
    expect(mockService.createDeal).toHaveBeenCalledWith(dto, undefined, 'u-1');
    expect(res).toEqual({ id: 'd-1' });
  });

  it('should call updateDeal with user id', async () => {
    const dto: any = { title: 'Updated' };
    mockService.updateDeal.mockResolvedValue({ id: 'd-1' });

    const res = await controller.updateDeal('d-1', dto, { user: { id: 'u-1' } });
    expect(mockService.updateDeal).toHaveBeenCalledWith('d-1', dto, undefined, 'u-1');
    expect(res).toEqual({ id: 'd-1' });
  });

  it('should call deleteDeal', async () => {
    mockService.deleteDeal.mockResolvedValue({ success: true });

    const res = await controller.deleteDeal('d-1');
    expect(mockService.deleteDeal).toHaveBeenCalledWith('d-1');
    expect(res).toEqual({ success: true });
  });

  it('should call addActivity', async () => {
    const dto: any = { type: 'note', details: { text: 'called' } };
    mockService.addDealActivity.mockResolvedValue({ id: 'act-1' });

    const res = await controller.addActivity('d-1', dto, { user: { id: 'u-1' } });
    expect(mockService.addDealActivity).toHaveBeenCalledWith('d-1', dto, 'u-1');
    expect(res).toEqual({ id: 'act-1' });
  });
});
