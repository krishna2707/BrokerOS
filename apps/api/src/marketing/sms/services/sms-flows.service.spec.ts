jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { SmsFlowsService } from './sms-flows.service.js';

describe('SmsFlowsService', () => {
  let service: SmsFlowsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      smsFlow: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      smsFlowNode: {
        create: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      smsFlowRun: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      }),
    };

    service = new SmsFlowsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should list formatted flows with counts and project name', async () => {
      mockPrisma.smsFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          name: 'Site Visit Followup',
          description: 'Auto followup',
          status: 'active',
          triggerType: 'keyword_match',
          triggerConfig: { keywords: ['visit'] },
          isGlobal: true,
          campaignIds: ['camp-1'],
          projectId: 'p-1',
          project: { id: 'p-1', name: 'Skyline Palms' },
          _count: { nodes: 3, runs: 12 },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
        },
      ]);

      const res = await service.findAll();

      expect(res.items.length).toBe(1);
      expect(res.items[0].name).toBe('Site Visit Followup');
      expect(res.items[0].nodesCount).toBe(3);
      expect(res.items[0].runsCount).toBe(12);
      expect(res.items[0].projectName).toBe('Skyline Palms');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if flow does not exist', async () => {
      mockPrisma.smsFlow.findUnique.mockResolvedValue(null);

      await expect(service.findById('flow-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return flow if found', async () => {
      const mockFlow = { id: 'flow-1', name: 'Test Flow', nodes: [] };
      mockPrisma.smsFlow.findUnique.mockResolvedValue(mockFlow);

      const res = await service.findById('flow-1');
      expect(res).toEqual(mockFlow);
    });
  });

  describe('create', () => {
    it('should create flow and nodes in transaction', async () => {
      mockPrisma.smsFlow.create.mockResolvedValue({ id: 'flow-new' });
      mockPrisma.smsFlowNode.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.smsFlow.findUnique.mockResolvedValue({
        id: 'flow-new',
        name: 'New Flow',
        nodes: [{ id: 'n-1' }, { id: 'n-2' }],
      });

      const res = await service.create({
        name: 'New Flow',
        description: 'Testing',
        nodes: [
          { nodeType: 'trigger', nodeKey: 'k1', config: {} },
          { nodeType: 'send_sms', nodeKey: 'k2', config: {} },
        ],
      });

      expect(mockPrisma.smsFlow.create).toHaveBeenCalled();
      expect(mockPrisma.smsFlowNode.createMany).toHaveBeenCalled();
      expect(res.id).toBe('flow-new');
    });
  });

  describe('update', () => {
    it('should update flow and recreate nodes in transaction', async () => {
      mockPrisma.smsFlow.findUnique.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.smsFlow.update.mockResolvedValue({});
      mockPrisma.smsFlowNode.deleteMany.mockResolvedValue({});
      mockPrisma.smsFlowNode.createMany.mockResolvedValue({});

      await service.update('flow-1', {
        name: 'Updated Flow',
        nodes: [{ nodeType: 'send_sms', nodeKey: 'n1', config: {} }],
      });

      expect(mockPrisma.smsFlow.update).toHaveBeenCalled();
      expect(mockPrisma.smsFlowNode.deleteMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete flow after verifying existence', async () => {
      mockPrisma.smsFlow.findUnique.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.smsFlow.delete.mockResolvedValue({ id: 'flow-1' });

      await service.delete('flow-1');
      expect(mockPrisma.smsFlow.delete).toHaveBeenCalledWith({
        where: { id: 'flow-1' },
      });
    });
  });

  describe('duplicate', () => {
    it('should clone flow and its nodes', async () => {
      mockPrisma.smsFlow.findUnique
        .mockResolvedValueOnce({
          id: 'flow-1',
          name: 'Original Flow',
          nodes: [
            {
              nodeKey: 'n1',
              nodeType: 'start',
              config: {},
              positionX: 0,
              positionY: 0,
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'flow-clone',
          name: 'Copy of Original Flow',
        });

      mockPrisma.smsFlow.create.mockResolvedValue({ id: 'flow-clone' });
      mockPrisma.smsFlowNode.createMany.mockResolvedValue({ count: 1 });

      const res = await service.duplicate('flow-1');

      expect(mockPrisma.smsFlow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Copy of Original Flow' }),
        }),
      );
      expect(res.id).toBe('flow-clone');
    });
  });

  describe('getFlowRuns', () => {
    it('should return recent execution runs', async () => {
      mockPrisma.smsFlowRun.findMany.mockResolvedValue([
        { id: 'run-1', status: 'completed' },
      ]);

      const res = await service.getFlowRuns('flow-1');
      expect(res.length).toBe(1);
      expect(mockPrisma.smsFlowRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { flowId: 'flow-1' } }),
      );
    });
  });
});
