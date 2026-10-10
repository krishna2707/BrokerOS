jest.mock('../../../lib/database/prisma.service.js', () => ({
  PrismaService: class MockPrismaService {},
}));

import { NotFoundException } from '@nestjs/common';
import { EmailFlowsService } from './email-flows.service.js';

describe('EmailFlowsService', () => {
  let service: EmailFlowsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
      emailFlow: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      emailFlowNode: {
        create: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      emailFlowRun: {
        findMany: jest.fn(),
      },
    };

    service = new EmailFlowsService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return mapped list of flows with node/run counts', async () => {
      mockPrisma.emailFlow.findMany.mockResolvedValue([
        {
          id: 'flow-1',
          name: 'Welcome Sequence',
          description: 'Auto-reply to leads',
          status: 'active',
          triggerType: 'keyword_match',
          triggerConfig: { keywords: ['price'] },
          isGlobal: true,
          campaignIds: [],
          projectId: 'p-1',
          project: { name: 'Skyline' },
          _count: { nodes: 3, runs: 12 },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
        },
      ]);

      const res = await service.findAll();
      expect(res.items).toHaveLength(1);
      expect(res.items[0].nodesCount).toBe(3);
      expect(res.items[0].runsCount).toBe(12);
      expect(res.items[0].projectName).toBe('Skyline');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if flow does not exist', async () => {
      mockPrisma.emailFlow.findUnique.mockResolvedValue(null);

      await expect(service.findById('flow-none')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return flow with nodes if found', async () => {
      mockPrisma.emailFlow.findUnique.mockResolvedValue({
        id: 'flow-1',
        name: 'Brochure Flow',
        nodes: [{ id: 'node-1', nodeType: 'start' }],
      });

      const res = await service.findById('flow-1');
      expect(res.id).toBe('flow-1');
      expect(res.nodes).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create flow with custom nodes', async () => {
      mockPrisma.emailFlow.create.mockResolvedValue({ id: 'flow-new' });
      mockPrisma.emailFlow.findUnique.mockResolvedValue({
        id: 'flow-new',
        name: 'New Flow',
        nodes: [{ id: 'n1', nodeType: 'send_email' }],
      });

      const res = await service.create({
        name: 'New Flow',
        triggerType: 'keyword_match',
        nodes: [{ nodeType: 'send_email', config: { subject: 'Hi' } }],
      } as any);

      expect(mockPrisma.emailFlowNode.createMany).toHaveBeenCalled();
      expect(res.id).toBe('flow-new');
    });

    it('should create default start node when no nodes are provided', async () => {
      mockPrisma.emailFlow.create.mockResolvedValue({ id: 'flow-default' });
      mockPrisma.emailFlow.findUnique.mockResolvedValue({
        id: 'flow-default',
        name: 'Empty Flow',
        nodes: [{ nodeType: 'start' }],
      });

      const res = await service.create({
        name: 'Empty Flow',
      });

      expect(mockPrisma.emailFlowNode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nodeType: 'start' }),
        }),
      );
      expect(res.id).toBe('flow-default');
    });
  });

  describe('update', () => {
    it('should update flow and recreate nodes', async () => {
      mockPrisma.emailFlow.findUnique.mockResolvedValue({ id: 'flow-1' });

      const res = await service.update('flow-1', {
        name: 'Updated Name',
        nodes: [{ nodeType: 'ai_reply' }],
      } as any);

      expect(mockPrisma.emailFlowNode.deleteMany).toHaveBeenCalledWith({
        where: { flowId: 'flow-1' },
      });
      expect(mockPrisma.emailFlowNode.createMany).toHaveBeenCalled();
      expect(res.id).toBe('flow-1');
    });
  });

  describe('delete', () => {
    it('should delete existing flow', async () => {
      mockPrisma.emailFlow.findUnique.mockResolvedValue({ id: 'flow-1' });
      mockPrisma.emailFlow.delete.mockResolvedValue({ id: 'flow-1' });

      const res = await service.delete('flow-1');
      expect(res.id).toBe('flow-1');
    });
  });

  describe('duplicate', () => {
    it('should clone flow and its nodes', async () => {
      mockPrisma.emailFlow.findUnique
        .mockResolvedValueOnce({
          id: 'flow-orig',
          name: 'Original',
          nodes: [{ nodeKey: 'k1', nodeType: 'start' }],
        })
        .mockResolvedValueOnce({
          id: 'flow-clone',
          name: 'Copy of Original',
          nodes: [{ nodeKey: 'k1', nodeType: 'start' }],
        });

      mockPrisma.emailFlow.create.mockResolvedValue({ id: 'flow-clone' });

      const res = await service.duplicate('flow-orig');
      expect(res.id).toBe('flow-clone');
      expect(mockPrisma.emailFlowNode.createMany).toHaveBeenCalled();
    });
  });

  describe('getFlowRuns', () => {
    it('should return recent execution runs for a flow', async () => {
      mockPrisma.emailFlowRun.findMany.mockResolvedValue([
        { id: 'run-1', flowId: 'flow-1', status: 'completed' },
      ]);

      const runs = await service.getFlowRuns('flow-1');
      expect(runs).toHaveLength(1);
    });
  });
});
