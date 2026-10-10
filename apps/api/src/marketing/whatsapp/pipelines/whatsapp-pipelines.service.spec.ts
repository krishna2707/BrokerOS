import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppPipelinesService } from './whatsapp-pipelines.service.js';

describe('WhatsAppPipelinesService', () => {
  let service: WhatsAppPipelinesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn().mockResolvedValue({ id: 'acc-1' }),
      },
      whatsAppPipeline: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      whatsAppPipelineStage: {
        update: jest.fn(),
        create: jest.fn(),
      },
      whatsAppDeal: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppDealActivity: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    service = new WhatsAppPipelinesService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listPipelines', () => {
    it('should return existing pipelines', async () => {
      mockPrisma.whatsAppPipeline.findMany.mockResolvedValue([
        { id: 'p-1', name: 'Real Estate Pipeline', stages: [] },
      ]);

      const res = await service.listPipelines('acc-1');
      expect(res.pipelines.length).toBe(1);
      expect(res.pipelines[0].id).toBe('p-1');
    });

    it('should auto-seed default pipeline if none exists', async () => {
      mockPrisma.whatsAppPipeline.findMany.mockResolvedValue([]);
      mockPrisma.whatsAppPipeline.create.mockResolvedValue({
        id: 'p-seed',
        name: 'Real Estate Sales Pipeline',
        stages: [{ name: 'New Inquiry' }],
      });

      const res = await service.listPipelines('acc-1');
      expect(mockPrisma.whatsAppPipeline.create).toHaveBeenCalled();
      expect(res.pipelines.length).toBe(1);
      expect(res.pipelines[0].id).toBe('p-seed');
    });
  });

  describe('getPipeline', () => {
    it('should throw NotFoundException if pipeline not found', async () => {
      mockPrisma.whatsAppPipeline.findFirst.mockResolvedValue(null);

      await expect(service.getPipeline('none', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return pipeline when found', async () => {
      mockPrisma.whatsAppPipeline.findFirst.mockResolvedValue({ id: 'p-1' });

      const res = await service.getPipeline('p-1', 'acc-1');
      expect(res.id).toBe('p-1');
    });
  });

  describe('createPipeline', () => {
    it('should create pipeline with custom or default stages', async () => {
      mockPrisma.whatsAppPipeline.create.mockResolvedValue({
        id: 'p-created',
        name: 'Luxury Villas',
      });

      const res = await service.createPipeline({
        name: 'Luxury Villas',
        stages: [{ name: 'Warm Inquiry', position: 0 }],
      });

      expect(mockPrisma.whatsAppPipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Luxury Villas',
          }),
        }),
      );
      expect(res.id).toBe('p-created');
    });
  });

  describe('Deals Management', () => {
    it('should list deals in pipeline', async () => {
      mockPrisma.whatsAppDeal.findMany.mockResolvedValue([
        { id: 'd-1', title: 'Penthouse 401', value: 25000000 },
      ]);

      const res = await service.listDeals('p-1', 'acc-1');
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].title).toBe('Penthouse 401');
    });

    it('should create deal and log deal created activity', async () => {
      mockPrisma.whatsAppDeal.create.mockResolvedValue({
        id: 'd-1',
        title: '3BHK Villa Booking',
        stage: { name: 'Site Visit Scheduled' },
      });
      mockPrisma.whatsAppDealActivity.create.mockResolvedValue({ id: 'act-1' });

      const res = await service.createDeal(
        {
          pipelineId: 'p-1',
          stageId: 's-1',
          contactId: 'c-1',
          title: '3BHK Villa Booking',
          value: 15000000,
        },
        'acc-1',
        'user-1',
      );

      expect(res.id).toBe('d-1');
      expect(mockPrisma.whatsAppDealActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dealId: 'd-1',
            type: 'created',
          }),
        }),
      );
    });

    it('should update deal and record stage_moved activity when stage changes', async () => {
      mockPrisma.whatsAppDeal.findFirst.mockResolvedValue({
        id: 'd-1',
        stageId: 's-old',
        stage: { name: 'New Inquiry' },
      });
      mockPrisma.whatsAppDeal.update.mockResolvedValue({
        id: 'd-1',
        stageId: 's-new',
        stage: { name: 'Negotiation' },
      });

      const res = await service.updateDeal(
        'd-1',
        { stageId: 's-new' },
        'acc-1',
        'user-1',
      );

      expect(mockPrisma.whatsAppDealActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'stage_moved',
            details: {
              fromStage: 'New Inquiry',
              toStage: 'Negotiation',
            },
          }),
        }),
      );
      expect(res.id).toBe('d-1');
    });

    it('should delete deal', async () => {
      mockPrisma.whatsAppDeal.findFirst.mockResolvedValue({ id: 'd-1' });
      mockPrisma.whatsAppDeal.delete.mockResolvedValue({ id: 'd-1' });

      const res = await service.deleteDeal('d-1', 'acc-1');
      expect(res.success).toBe(true);
    });
  });
});
