import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
}));

import { UnitsController } from './units.controller.js';
import { InventoryService } from '../core/inventory.service.js';

describe('UnitsController', () => {
  let controller: UnitsController;
  let service: {
    updateUnitStatus: jest.Mock;
    getBookingForUnit: jest.Mock;
    updateProjectPossession: jest.Mock;
    updateTowerPossession: jest.Mock;
    updateUnitPossession: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      updateUnitStatus: jest.fn(),
      getBookingForUnit: jest.fn(),
      updateProjectPossession: jest.fn(),
      updateTowerPossession: jest.fn(),
      updateUnitPossession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [{ provide: InventoryService, useValue: service }],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateUnitStatus', () => {
    it('should call inventoryService.updateUnitStatus with unitId, data and userId', async () => {
      service.updateUnitStatus.mockResolvedValue({ id: 'u-1', status: 'SOLD' });
      const req = { user: { id: 'user-1' } };
      const body = { status: 'SOLD' } as any;

      const res = await controller.updateUnitStatus('u-1', body, req);

      expect(service.updateUnitStatus).toHaveBeenCalledWith(
        'u-1',
        body,
        'user-1',
      );
      expect(res).toEqual({ id: 'u-1', status: 'SOLD' });
    });
  });

  describe('getBookingForUnit', () => {
    it('should call inventoryService.getBookingForUnit with unitId', async () => {
      service.getBookingForUnit.mockResolvedValue({ id: 'b-1' });

      const res = await controller.getBookingForUnit('u-1');

      expect(service.getBookingForUnit).toHaveBeenCalledWith('u-1');
      expect(res).toEqual({ id: 'b-1' });
    });
  });

  describe('updateProjectPossession', () => {
    it('should call inventoryService.updateProjectPossession with projectId and data', async () => {
      service.updateProjectPossession.mockResolvedValue({ id: 'p-1' });
      const body = { status: 'READY_TO_MOVE', timeline: 'Immediate' } as any;

      const res = await controller.updateProjectPossession('p-1', body);

      expect(service.updateProjectPossession).toHaveBeenCalledWith('p-1', body);
      expect(res).toEqual({ id: 'p-1' });
    });
  });

  describe('updateTowerPossession', () => {
    it('should call inventoryService.updateTowerPossession with towerId and data', async () => {
      service.updateTowerPossession.mockResolvedValue({ id: 't-1' });
      const body = { status: 'UNDER_CONSTRUCTION', timeline: 'Q2 2027' } as any;

      const res = await controller.updateTowerPossession('t-1', body);

      expect(service.updateTowerPossession).toHaveBeenCalledWith('t-1', body);
      expect(res).toEqual({ id: 't-1' });
    });
  });

  describe('updateUnitPossession', () => {
    it('should call inventoryService.updateUnitPossession with unitId and data', async () => {
      service.updateUnitPossession.mockResolvedValue({ id: 'u-1' });
      const body = { status: 'READY_TO_MOVE', timeline: 'Immediate' } as any;

      const res = await controller.updateUnitPossession('u-1', body);

      expect(service.updateUnitPossession).toHaveBeenCalledWith('u-1', body);
      expect(res).toEqual({ id: 'u-1' });
    });
  });
});
