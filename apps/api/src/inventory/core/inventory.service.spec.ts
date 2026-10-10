import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { InventoryService } from './inventory.service.js';
import { InventoryProjectsService } from '../projects/inventory-projects.service.js';
import { InventoryTowerGenService } from '../towers/inventory-tower-gen.service.js';
import { InventoryUnitsService } from '../units/inventory-units.service.js';

describe('InventoryService', () => {
  let service: InventoryService;
  let projectsService: {
    getProjects: jest.Mock;
    createProject: jest.Mock;
    getProjectTowers: jest.Mock;
    getTowerAssignments: jest.Mock;
    assignTower: jest.Mock;
    getProjectAssignments: jest.Mock;
    assignProject: jest.Mock;
  };
  let towerGenService: {
    generateTowerPrompt: jest.Mock;
    saveGeneratedTower: jest.Mock;
  };
  let unitsService: {
    updateUnitStatus: jest.Mock;
    getBookingForUnit: jest.Mock;
    updateProjectPossession: jest.Mock;
    updateTowerPossession: jest.Mock;
    updateUnitPossession: jest.Mock;
  };

  beforeEach(async () => {
    projectsService = {
      getProjects: jest.fn().mockResolvedValue([{ id: 'p-1' }]),
      createProject: jest.fn().mockResolvedValue({ id: 'p-1' }),
      getProjectTowers: jest.fn().mockResolvedValue([{ id: 't-1' }]),
      getTowerAssignments: jest.fn().mockResolvedValue([]),
      assignTower: jest.fn().mockResolvedValue({ success: true }),
      getProjectAssignments: jest.fn().mockResolvedValue([]),
      assignProject: jest.fn().mockResolvedValue({ success: true }),
    };

    towerGenService = {
      generateTowerPrompt: jest.fn().mockResolvedValue({ name: 'Tower A' }),
      saveGeneratedTower: jest.fn().mockResolvedValue({ id: 't-1' }),
    };

    unitsService = {
      updateUnitStatus: jest.fn().mockResolvedValue({ id: 'u-1' }),
      getBookingForUnit: jest.fn().mockResolvedValue({ id: 'b-1' }),
      updateProjectPossession: jest.fn().mockResolvedValue({ id: 'p-1' }),
      updateTowerPossession: jest.fn().mockResolvedValue({ id: 't-1' }),
      updateUnitPossession: jest.fn().mockResolvedValue({ id: 'u-1' }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: InventoryProjectsService, useValue: projectsService },
        { provide: InventoryTowerGenService, useValue: towerGenService },
        { provide: InventoryUnitsService, useValue: unitsService },
      ],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('projects delegation', () => {
    it('should delegate getProjects', async () => {
      const query = { isCpProject: true };
      const res = await service.getProjects(query, 'user-1');
      expect(projectsService.getProjects).toHaveBeenCalledWith(query, 'user-1');
      expect(res).toEqual([{ id: 'p-1' }]);
    });

    it('should delegate createProject', async () => {
      const dto = { name: 'Project A', isCpProject: false } as any;
      const res = await service.createProject(dto, 'user-1');
      expect(projectsService.createProject).toHaveBeenCalledWith(dto, 'user-1');
      expect(res).toEqual({ id: 'p-1' });
    });

    it('should delegate getProjectTowers', async () => {
      const res = await service.getProjectTowers('p-1', 'user-1');
      expect(projectsService.getProjectTowers).toHaveBeenCalledWith(
        'p-1',
        'user-1',
      );
      expect(res).toEqual([{ id: 't-1' }]);
    });

    it('should delegate getTowerAssignments', async () => {
      const res = await service.getTowerAssignments('t-1');
      expect(projectsService.getTowerAssignments).toHaveBeenCalledWith('t-1');
      expect(res).toEqual([]);
    });

    it('should delegate assignTower', async () => {
      const res = await service.assignTower(
        't-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );
      expect(projectsService.assignTower).toHaveBeenCalledWith(
        't-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );
      expect(res).toEqual({ success: true });
    });

    it('should delegate getProjectAssignments', async () => {
      const res = await service.getProjectAssignments('p-1');
      expect(projectsService.getProjectAssignments).toHaveBeenCalledWith('p-1');
      expect(res).toEqual([]);
    });

    it('should delegate assignProject', async () => {
      const res = await service.assignProject(
        'p-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );
      expect(projectsService.assignProject).toHaveBeenCalledWith(
        'p-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );
      expect(res).toEqual({ success: true });
    });
  });

  describe('tower generation delegation', () => {
    it('should delegate generateTowerPrompt', async () => {
      const res = await service.generateTowerPrompt('p-1', 'create tower');
      expect(towerGenService.generateTowerPrompt).toHaveBeenCalledWith(
        'p-1',
        'create tower',
      );
      expect(res).toEqual({ name: 'Tower A' });
    });

    it('should delegate saveGeneratedTower', async () => {
      const dto = { name: 'Tower A', floors: [] };
      const res = await service.saveGeneratedTower('p-1', dto);
      expect(towerGenService.saveGeneratedTower).toHaveBeenCalledWith(
        'p-1',
        dto,
      );
      expect(res).toEqual({ id: 't-1' });
    });
  });

  describe('units delegation', () => {
    it('should delegate updateUnitStatus', async () => {
      const dto = { status: 'SOLD' } as any;
      const res = await service.updateUnitStatus('u-1', dto, 'user-1');
      expect(unitsService.updateUnitStatus).toHaveBeenCalledWith(
        'u-1',
        dto,
        'user-1',
      );
      expect(res).toEqual({ id: 'u-1' });
    });

    it('should delegate getBookingForUnit', async () => {
      const res = await service.getBookingForUnit('u-1');
      expect(unitsService.getBookingForUnit).toHaveBeenCalledWith('u-1');
      expect(res).toEqual({ id: 'b-1' });
    });

    it('should delegate updateProjectPossession', async () => {
      const dto = { status: 'READY_TO_MOVE', timeline: 'Q4 2026' } as any;
      const res = await service.updateProjectPossession('p-1', dto);
      expect(unitsService.updateProjectPossession).toHaveBeenCalledWith(
        'p-1',
        dto,
      );
      expect(res).toEqual({ id: 'p-1' });
    });

    it('should delegate updateTowerPossession', async () => {
      const dto = { status: 'UNDER_CONSTRUCTION', timeline: 'Q1 2027' } as any;
      const res = await service.updateTowerPossession('t-1', dto);
      expect(unitsService.updateTowerPossession).toHaveBeenCalledWith(
        't-1',
        dto,
      );
      expect(res).toEqual({ id: 't-1' });
    });

    it('should delegate updateUnitPossession', async () => {
      const dto = { status: 'READY_TO_MOVE', timeline: 'Immediate' } as any;
      const res = await service.updateUnitPossession('u-1', dto);
      expect(unitsService.updateUnitPossession).toHaveBeenCalledWith(
        'u-1',
        dto,
      );
      expect(res).toEqual({ id: 'u-1' });
    });
  });
});
