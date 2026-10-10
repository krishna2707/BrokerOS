import { WhatsAppTemplatesController } from './whatsapp-templates.controller.js';

describe('WhatsAppTemplatesController', () => {
  let controller: WhatsAppTemplatesController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listTemplates: jest.fn(),
      getTemplate: jest.fn(),
      createTemplate: jest.fn(),
      syncTemplates: jest.fn(),
      deleteTemplate: jest.fn(),
    };

    controller = new WhatsAppTemplatesController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listTemplates', async () => {
    mockService.listTemplates.mockResolvedValue({ items: [] });

    const res = await controller.listTemplates({});
    expect(mockService.listTemplates).toHaveBeenCalledWith({});
    expect(res).toEqual({ items: [] });
  });

  it('should call getTemplate', async () => {
    mockService.getTemplate.mockResolvedValue({ id: 't-1' });

    const res = await controller.getTemplate('t-1');
    expect(mockService.getTemplate).toHaveBeenCalledWith('t-1');
    expect(res).toEqual({ id: 't-1' });
  });

  it('should call createTemplate', async () => {
    const dto: any = { name: 'lead_welcome', bodyText: 'Hi' };
    mockService.createTemplate.mockResolvedValue({ id: 't-1' });

    const res = await controller.createTemplate(dto);
    expect(mockService.createTemplate).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 't-1' });
  });

  it('should call syncTemplates', async () => {
    mockService.syncTemplates.mockResolvedValue({ syncedCount: 5 });

    const res = await controller.syncTemplates('acc-1');
    expect(mockService.syncTemplates).toHaveBeenCalledWith('acc-1');
    expect(res).toEqual({ syncedCount: 5 });
  });

  it('should call deleteTemplate', async () => {
    mockService.deleteTemplate.mockResolvedValue({ success: true });

    const res = await controller.deleteTemplate('t-1');
    expect(mockService.deleteTemplate).toHaveBeenCalledWith('t-1');
    expect(res).toEqual({ success: true });
  });
});
