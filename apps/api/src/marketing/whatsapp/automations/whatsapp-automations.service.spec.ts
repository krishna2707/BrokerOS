import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppAutomationsService } from './whatsapp-automations.service.js';

describe('WhatsAppAutomationsService', () => {
  let service: WhatsAppAutomationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      whatsAppBusinessAccount: {
        findFirst: jest.fn().mockResolvedValue({ id: 'acc-1' }),
      },
      whatsAppAutomation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      whatsAppAutomationStep: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      whatsAppAutomationLog: {
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

    service = new WhatsAppAutomationsService();
    (service as any).prisma = mockPrisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listAutomations', () => {
    it('should return paginated automations with assembled steps tree', async () => {
      mockPrisma.whatsAppAutomation.findMany.mockResolvedValue([
        {
          id: 'auto-1',
          name: 'Welcome Brochure',
          steps: [
            {
              id: 's-1',
              stepType: 'send_message',
              stepConfig: { text: 'Hello' },
              position: 0,
              parentStepId: null,
              branch: null,
            },
          ],
          _count: { logs: 12 },
        },
      ]);
      mockPrisma.whatsAppAutomation.count.mockResolvedValue(1);

      const res = await service.listAutomations({ page: 1, limit: 10 }, 'acc-1');

      expect(res.items.length).toBe(1);
      expect(res.items[0].stepsTree.length).toBe(1);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('getAutomation', () => {
    it('should throw NotFoundException if automation not found', async () => {
      mockPrisma.whatsAppAutomation.findFirst.mockResolvedValue(null);

      await expect(service.getAutomation('none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return automation with stepsTree', async () => {
      mockPrisma.whatsAppAutomation.findFirst.mockResolvedValue({
        id: 'auto-1',
        name: 'Lead Responder',
        steps: [],
      });

      const res = await service.getAutomation('auto-1');
      expect(res.id).toBe('auto-1');
      expect(res.stepsTree).toEqual([]);
    });
  });

  describe('createAutomation', () => {
    it('should throw BadRequestException if steps array is empty', async () => {
      await expect(
        service.createAutomation({
          name: 'Empty',
          triggerType: 'first_inbound_message',
          steps: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create automation and its steps in transaction', async () => {
      mockPrisma.whatsAppAutomation.create.mockResolvedValue({
        id: 'auto-new',
        name: 'Auto Reply',
      });
      mockPrisma.whatsAppAutomationStep.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.whatsAppAutomation.findUnique.mockResolvedValue({
        id: 'auto-new',
        name: 'Auto Reply',
        steps: [
          {
            id: 's-1',
            stepType: 'send_message',
            stepConfig: { text: 'Welcome' },
            position: 0,
            parentStepId: null,
            branch: null,
          },
        ],
      });

      const res = await service.createAutomation({
        name: 'Auto Reply',
        triggerType: 'first_inbound_message',
        steps: [{ stepType: 'send_message', stepConfig: { text: 'Welcome' } }],
      });

      expect(mockPrisma.whatsAppAutomation.create).toHaveBeenCalled();
      expect(mockPrisma.whatsAppAutomationStep.createMany).toHaveBeenCalled();
      expect(res.id).toBe('auto-new');
      expect(res.stepsTree.length).toBe(1);
    });
  });

  describe('toggleAutomation & deleteAutomation', () => {
    it('should toggle active state', async () => {
      mockPrisma.whatsAppAutomation.findFirst.mockResolvedValue({ id: 'auto-1', steps: [] });
      mockPrisma.whatsAppAutomation.update.mockResolvedValue({
        id: 'auto-1',
        isActive: false,
      });

      const res = await service.toggleAutomation('auto-1', false);
      expect(res.isActive).toBe(false);
    });

    it('should delete automation', async () => {
      mockPrisma.whatsAppAutomation.findFirst.mockResolvedValue({ id: 'auto-1', steps: [] });
      mockPrisma.whatsAppAutomation.delete.mockResolvedValue({ id: 'auto-1' });

      const res = await service.deleteAutomation('auto-1');
      expect(res.success).toBe(true);
    });
  });

  describe('getLogs', () => {
    it('should return execution logs for automation', async () => {
      mockPrisma.whatsAppAutomation.findFirst.mockResolvedValue({ id: 'auto-1', steps: [] });
      mockPrisma.whatsAppAutomationLog.findMany.mockResolvedValue([
        { id: 'log-1', status: 'success', contact: { name: 'Amit' } },
      ]);
      mockPrisma.whatsAppAutomationLog.count.mockResolvedValue(1);

      const res = await service.getLogs('auto-1', { page: 1, limit: 10 });
      expect(res.items.length).toBe(1);
      expect(res.pagination.total).toBe(1);
    });
  });
});
