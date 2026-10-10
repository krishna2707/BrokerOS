import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
}));

import { ProjectsController } from './projects.controller.js';
import { InventoryService } from '../core/inventory.service.js';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: {
    getProjects: jest.Mock;
    createProject: jest.Mock;
    getProjectTowers: jest.Mock;
    getTowerAssignments: jest.Mock;
    assignTower: jest.Mock;
    getProjectAssignments: jest.Mock;
    assignProject: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getProjects: jest.fn(),
      createProject: jest.fn(),
      getProjectTowers: jest.fn(),
      getTowerAssignments: jest.fn(),
      assignTower: jest.fn(),
      getProjectAssignments: jest.fn(),
      assignProject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: InventoryService, useValue: service }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjects', () => {
    it('should call inventoryService.getProjects with user id', async () => {
      service.getProjects.mockResolvedValue([{ id: 'p-1' }]);
      const req = { user: { id: 'u-1' } };
      const query = { isCpProject: true };

      const res = await controller.getProjects(query, req);

      expect(service.getProjects).toHaveBeenCalledWith(query, 'u-1');
      expect(res).toEqual([{ id: 'p-1' }]);
    });
  });

  describe('createProject', () => {
    it('should call inventoryService.createProject with body and user id', async () => {
      service.createProject.mockResolvedValue({ id: 'p-new' });
      const req = { user: { id: 'u-1' } };
      const body = { name: 'New Project' } as any;

      const res = await controller.createProject(body, req);

      expect(service.createProject).toHaveBeenCalledWith(body, 'u-1');
      expect(res).toEqual({ id: 'p-new' });
    });
  });

  describe('getProjectTowers', () => {
    it('should call inventoryService.getProjectTowers with projectId and user id', async () => {
      service.getProjectTowers.mockResolvedValue([{ id: 't-1' }]);
      const req = { user: { id: 'u-1' } };

      const res = await controller.getProjectTowers('p-1', req);

      expect(service.getProjectTowers).toHaveBeenCalledWith('p-1', 'u-1');
      expect(res).toEqual([{ id: 't-1' }]);
    });
  });

  describe('getTowerAssignments', () => {
    it('should call inventoryService.getTowerAssignments', async () => {
      service.getTowerAssignments.mockResolvedValue([{ id: 'ta-1' }]);

      const res = await controller.getTowerAssignments('t-1');

      expect(service.getTowerAssignments).toHaveBeenCalledWith('t-1');
      expect(res).toEqual([{ id: 'ta-1' }]);
    });
  });

  describe('assignTower', () => {
    it('should call inventoryService.assignTower with IDs', async () => {
      service.assignTower.mockResolvedValue({ success: true });
      const body = {
        sourcingManagerIds: ['sm-1'],
        closingManagerIds: ['cm-1'],
        salesExecIds: ['se-1'],
      };

      const res = await controller.assignTower('t-1', body);

      expect(service.assignTower).toHaveBeenCalledWith(
        't-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );
      expect(res).toEqual({ success: true });
    });
  });

  describe('getProjectAssignments', () => {
    it('should call inventoryService.getProjectAssignments', async () => {
      service.getProjectAssignments.mockResolvedValue([{ id: 'pa-1' }]);

      const res = await controller.getProjectAssignments('p-1');

      expect(service.getProjectAssignments).toHaveBeenCalledWith('p-1');
      expect(res).toEqual([{ id: 'pa-1' }]);
    });
  });

  describe('assignProject', () => {
    it('should call inventoryService.assignProject with IDs', async () => {
      service.assignProject.mockResolvedValue({ success: true });
      const body = {
        sourcingManagerIds: ['sm-1'],
        closingManagerIds: ['cm-1'],
      };

      const res = await controller.assignProject('p-1', body);

      expect(service.assignProject).toHaveBeenCalledWith(
        'p-1',
        ['sm-1'],
        ['cm-1'],
        [],
      );
      expect(res).toEqual({ success: true });
    });
  });
});
