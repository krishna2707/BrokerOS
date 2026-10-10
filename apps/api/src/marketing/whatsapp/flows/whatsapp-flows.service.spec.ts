import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppFlowsService } from './whatsapp-flows.service.js';

describe('WhatsAppFlowsService', () => {
  let service: WhatsAppFlowsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn().mockResolvedValue({ id: 'acc-1' }),
      },
      whatsAppFlow: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      whatsAppFlowNode: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      whatsAppFlowRun: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    service = new WhatsAppFlowsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listFlows', () => {
    it('should return paginated flows with node and run counts', async () => {
      mockPrisma.whatsAppFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          name: 'Site Visit Booking Bot',
          nodes: [{ id: 'n-1' }, { id: 'n-2' }],
          _count: { runs: 50 },
        },
      ]);
      mockPrisma.whatsAppFlow.count.mockResolvedValue(1);

      const res = await service.listFlows({ page: 1, limit: 10 }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.items[0].nodesCount).toBe(2);
      expect(res.items[0].runsCount).toBe(50);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('getFlow', () => {
    it('should throw NotFoundException if flow not found', async () => {
      mockPrisma.whatsAppFlow.findFirst.mockResolvedValue(null);

      await expect(service.getFlow('none')).rejects.toThrow(NotFoundException);
    });

    it('should return flow with nodes and runs count', async () => {
      mockPrisma.whatsAppFlow.findFirst.mockResolvedValue({
        id: 'flow-1',
        name: 'Concierge',
        nodes: [],
        _count: { runs: 10 },
      });

      const res = await service.getFlow('flow-1');
      expect(res.id).toBe('flow-1');
    });
  });

  describe('createFlow', () => {
    it('should throw BadRequestException if no account found', async () => {
      mockPrisma.whatsAppBusinessAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.createFlow({ name: 'Bot', triggerType: 'keyword' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create flow and its nodes in transaction', async () => {
      mockPrisma.whatsAppFlow.create.mockResolvedValue({
        id: 'flow-new',
        name: 'Lead Bot',
      });
      mockPrisma.whatsAppFlowNode.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.whatsAppFlow.findUnique.mockResolvedValue({
        id: 'flow-new',
        name: 'Lead Bot',
        nodes: [{ id: 'n-1', nodeKey: 'start' }],
      });

      const res = await service.createFlow({
        name: 'Lead Bot',
        triggerType: 'keyword',
        nodes: [{ nodeKey: 'start', nodeType: 'send_message', config: {} }],
      });

      expect(mockPrisma.whatsAppFlow.create).toHaveBeenCalled();
      expect(mockPrisma.whatsAppFlowNode.createMany).toHaveBeenCalled();
      expect(res?.id).toBe('flow-new');
    });
  });

  describe('toggleFlow & deleteFlow', () => {
    it('should toggle flow status', async () => {
      mockPrisma.whatsAppFlow.findFirst.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.whatsAppFlow.update.mockResolvedValue({
        id: 'flow-1',
        status: 'active',
      });

      const res = await service.toggleFlow('flow-1', 'active');
      expect(res.status).toBe('active');
    });

    it('should delete flow', async () => {
      mockPrisma.whatsAppFlow.findFirst.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.whatsAppFlow.delete.mockResolvedValue({ id: 'flow-1' });

      const res = await service.deleteFlow('flow-1');
      expect(res.success).toBe(true);
    });
  });

  describe('getFlowRuns', () => {
    it('should return paginated flow runs', async () => {
      mockPrisma.whatsAppFlow.findFirst.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.whatsAppFlowRun.findMany.mockResolvedValue([
        { id: 'run-1', status: 'completed' },
      ]);
      mockPrisma.whatsAppFlowRun.count.mockResolvedValue(1);

      const res = await service.getFlowRuns('flow-1', { page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
    });
  });
});
