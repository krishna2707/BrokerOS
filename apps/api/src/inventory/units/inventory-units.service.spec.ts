import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { InventoryUnitsService } from './inventory-units.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { UpdateUnitStatusDto, UpdatePossessionDto } from './dto/unit.dto.js';

describe('InventoryUnitsService', () => {
  let service: InventoryUnitsService;
  const mockPrisma = {
    unit: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    unitStatusHistory: { create: jest.fn() },
    booking: { findFirst: jest.fn() },
    project: { update: jest.fn() },
    tower: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryUnitsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InventoryUnitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateUnitStatus', () => {
    it('should throw NotFoundException if unit is not found', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUnitStatus('missing-unit', {} as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record status history on status change and update unit', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue({
        id: 'unit-1',
        status: 'AVAILABLE',
      });
      mockPrisma.unitStatusHistory.create.mockResolvedValue({});
      mockPrisma.unit.update.mockResolvedValue({
        id: 'unit-1',
        status: 'RESERVED',
      });

      const dto: UpdateUnitStatusDto = {
        status: 'RESERVED',
        reason: 'Customer token paid',
        basePrice: '2500000' as any,
      };

      const res = await service.updateUnitStatus('unit-1', dto, 'user-1');

      expect(mockPrisma.unitStatusHistory.create).toHaveBeenCalledWith({
        data: {
          unitId: 'unit-1',
          fromStatus: 'AVAILABLE',
          toStatus: 'RESERVED',
          changedById: 'user-1',
          reason: 'Customer token paid',
        },
      });
      expect(mockPrisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
        data: expect.objectContaining({
          status: 'RESERVED',
          basePrice: 2500000,
        }),
      });
      expect(res.status).toBe('RESERVED');
    });

    it('should clear booking timestamps when status is AVAILABLE and clearBooking is true', async () => {
      mockPrisma.unit.findUnique.mockResolvedValue({
        id: 'unit-1',
        status: 'SOLD',
      });
      mockPrisma.unitStatusHistory.create.mockResolvedValue({});
      mockPrisma.unit.update.mockResolvedValue({
        id: 'unit-1',
        status: 'AVAILABLE',
      });

      const dto: UpdateUnitStatusDto = {
        status: 'AVAILABLE',
        clearBooking: true,
      };

      await service.updateUnitStatus('unit-1', dto, 'user-1');

      expect(mockPrisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
        data: expect.objectContaining({
          status: 'AVAILABLE',
          blockedAt: null,
          blockedById: null,
          reservedAt: null,
          reservedForId: null,
          soldAt: null,
        }),
      });
    });
  });

  describe('getBookingForUnit', () => {
    it('should return active booking for unit', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        unitId: 'unit-1',
        status: 'CONFIRMED',
      });

      const res = await service.getBookingForUnit('unit-1');

      expect(mockPrisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            unitId: 'unit-1',
            status: { notIn: ['CANCELLED'] },
          },
        }),
      );
      expect(res?.id).toBe('b-1');
    });

    it('should return null if no active booking exists', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      const res = await service.getBookingForUnit('unit-1');

      expect(res).toBeNull();
    });
  });

  describe('updateProjectPossession', () => {
    it('should update project, towers, and child units in transaction', async () => {
      mockPrisma.project.update.mockResolvedValue({ id: 'p-1' });
      mockPrisma.tower.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.tower.findMany.mockResolvedValue([
        { floors: [{ id: 'f-1' }, { id: 'f-2' }] },
      ]);
      mockPrisma.unit.updateMany.mockResolvedValue({ count: 10 });

      const dto: UpdatePossessionDto = {
        status: 'READY_TO_MOVE',
        timeline: 'December 2026',
      };

      const res = await service.updateProjectPossession('p-1', dto);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: {
          constructionStatus: 'READY_TO_MOVE',
          possessionTimeline: 'December 2026',
        },
      });
      expect(mockPrisma.tower.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'p-1' },
        data: {
          constructionStatus: 'READY_TO_MOVE',
          possessionTimeline: 'December 2026',
        },
      });
      expect(mockPrisma.unit.updateMany).toHaveBeenCalledWith({
        where: { floorId: { in: ['f-1', 'f-2'] } },
        data: {
          constructionStatus: 'READY_TO_MOVE',
          possessionTimeline: 'December 2026',
        },
      });
      expect(res.id).toBe('p-1');
    });
  });

  describe('updateTowerPossession', () => {
    it('should update tower and child units in transaction', async () => {
      mockPrisma.tower.update.mockResolvedValue({
        id: 't-1',
        floors: [{ id: 'f-1' }],
      });
      mockPrisma.unit.updateMany.mockResolvedValue({ count: 5 });

      const dto: UpdatePossessionDto = {
        status: 'UNDER_CONSTRUCTION',
        timeline: 'June 2027',
      };

      const res = await service.updateTowerPossession('t-1', dto);

      expect(mockPrisma.tower.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          constructionStatus: 'UNDER_CONSTRUCTION',
          possessionTimeline: 'June 2027',
        },
        include: { floors: { select: { id: true } } },
      });
      expect(mockPrisma.unit.updateMany).toHaveBeenCalledWith({
        where: { floorId: { in: ['f-1'] } },
        data: {
          constructionStatus: 'UNDER_CONSTRUCTION',
          possessionTimeline: 'June 2027',
        },
      });
      expect(res.id).toBe('t-1');
    });
  });

  describe('updateUnitPossession', () => {
    it('should update single unit possession', async () => {
      mockPrisma.unit.update.mockResolvedValue({ id: 'u-1' });

      const dto: UpdatePossessionDto = {
        status: 'READY_TO_MOVE',
        timeline: 'Immediate',
      };

      const res = await service.updateUnitPossession('u-1', dto);

      expect(mockPrisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: {
          constructionStatus: 'READY_TO_MOVE',
          possessionTimeline: 'Immediate',
        },
      });
      expect(res.id).toBe('u-1');
    });
  });
});
