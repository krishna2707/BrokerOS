import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('@brokeros/prisma', () => ({
  NotificationType: { PROJECT_ASSIGNED: 'PROJECT_ASSIGNED' },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../../notifications/notifications.service.js');

import { InventoryProjectsService } from './inventory-projects.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationType } from '@brokeros/prisma';

describe('InventoryProjectsService', () => {
  let service: InventoryProjectsService;
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    project: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    projectAssignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    towerAssignment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    tower: { findMany: jest.fn() },
  };
  const mockNotifs = { createNotification: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifs },
      ],
    }).compile();
    service = module.get(InventoryProjectsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProjects', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getProjects({} as any, 'missing-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return projects for ADMIN role with explicit isCpProject filter', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-admin',
        role: { code: 'ADMIN' },
      });
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p-1', isCpProject: false },
      ]);

      const res = await service.getProjects(
        { isCpProject: 'false' as any },
        'u-admin',
      );

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { isCpProject: false },
        include: { builder: true, _count: { select: { towers: true } } },
      });
      expect(res).toEqual([{ id: 'p-1', isCpProject: false }]);
    });

    it('should return CP projects by default for CP roles', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-cp',
        role: { code: 'SOURCING_MANAGER' },
      });
      mockPrisma.projectAssignment.findMany.mockResolvedValue([
        { project: { id: 'p-cp-1', isCpProject: true } },
      ]);
      mockPrisma.towerAssignment.findMany.mockResolvedValue([]);

      const res = await service.getProjects({}, 'u-cp');

      expect(res).toEqual([{ id: 'p-cp-1', isCpProject: true }]);
    });

    it('should include tower-assigned projects for sales execs and filter duplicates', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-se',
        role: { code: 'SALES_EXECUTIVE' },
      });
      mockPrisma.projectAssignment.findMany.mockResolvedValue([
        { project: { id: 'p-1', isCpProject: false } },
      ]);
      mockPrisma.towerAssignment.findMany.mockResolvedValue([
        {
          tower: {
            projectId: 'p-2',
            project: { id: 'p-2', isCpProject: false },
          },
        },
        {
          tower: {
            projectId: 'p-1',
            project: { id: 'p-1', isCpProject: false },
          },
        },
      ]);

      const res = await service.getProjects({}, 'u-se');

      expect(res).toHaveLength(2);
      expect(res.map((p) => p.id)).toEqual(['p-1', 'p-2']);
    });
  });

  describe('createProject', () => {
    it('should create project with inline builder and assign user', async () => {
      mockPrisma.project.create.mockResolvedValue({
        id: 'p-new',
        name: 'Skyline Heights',
        isCpProject: true,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-sm',
        role: { code: 'SOURCING_MANAGER' },
      });
      mockPrisma.projectAssignment.create.mockResolvedValue({});

      const dto = {
        name: 'Skyline Heights',
        builderName: 'Prestige Builders',
        isCpProject: 'true' as any,
      } as any;

      const res = await service.createProject(dto, 'u-sm');

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Skyline Heights',
          builder: { create: { name: 'Prestige Builders' } },
          isCpProject: true,
        },
      });
      expect(mockPrisma.projectAssignment.create).toHaveBeenCalledWith({
        data: {
          projectId: 'p-new',
          userId: 'u-sm',
          role: 'SOURCING_MANAGER',
        },
      });
      expect(mockNotifs.createNotification).toHaveBeenCalledWith({
        userId: 'u-sm',
        type: NotificationType.PROJECT_ASSIGNED,
        title: 'You have been assigned to a new project.',
        body: 'Skyline Heights — CP Project. You are now assigned as SOURCING MANAGER.',
        actionUrl: '/dashboard/sourcing-manager/index',
        metadata: {
          projectId: 'p-new',
          projectName: 'Skyline Heights',
          assignedRole: 'SOURCING_MANAGER',
        },
      });
      expect(res.id).toBe('p-new');
    });

    it('should create project without userId without assigning user', async () => {
      mockPrisma.project.create.mockResolvedValue({
        id: 'p-new',
        name: 'Internal Tower',
        isCpProject: false,
      });

      const dto = {
        name: 'Internal Tower',
        builderId: 'b-1',
        isCpProject: false,
      } as any;

      const res = await service.createProject(dto);

      expect(mockPrisma.projectAssignment.create).not.toHaveBeenCalled();
      expect(res.id).toBe('p-new');
    });
  });

  describe('getProjectTowers', () => {
    it('should fetch all project towers when no role restriction', async () => {
      mockPrisma.tower.findMany.mockResolvedValue([{ id: 't-1' }]);

      const res = await service.getProjectTowers('proj-1');

      expect(mockPrisma.tower.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
      expect(res).toEqual([{ id: 't-1' }]);
    });

    it('should scope towers to towerAssignments if SM has no projectAssignment', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'sm-1',
        role: { code: 'SOURCING_MANAGER' },
      });
      mockPrisma.projectAssignment.findUnique.mockResolvedValue(null);
      mockPrisma.towerAssignment.findMany.mockResolvedValue([
        { towerId: 't-scoped-1' },
      ]);
      mockPrisma.tower.findMany.mockResolvedValue([{ id: 't-scoped-1' }]);

      const res = await service.getProjectTowers('proj-1', 'sm-1');

      expect(mockPrisma.tower.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', id: { in: ['t-scoped-1'] } },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
      expect(res).toEqual([{ id: 't-scoped-1' }]);
    });
  });

  describe('assignTower', () => {
    it('should delete existing assignments and create new ones', async () => {
      mockPrisma.towerAssignment.deleteMany.mockResolvedValue({});
      mockPrisma.towerAssignment.createMany.mockResolvedValue({ count: 3 });

      const res = await service.assignTower(
        't-1',
        ['sm-1'],
        ['cm-1'],
        ['se-1'],
      );

      expect(mockPrisma.towerAssignment.deleteMany).toHaveBeenCalledWith({
        where: {
          towerId: 't-1',
          role: {
            in: ['SOURCING_MANAGER', 'CLOSING_MANAGER', 'SALES_EXECUTIVE'],
          },
        },
      });
      expect(mockPrisma.towerAssignment.createMany).toHaveBeenCalledWith({
        data: [
          { towerId: 't-1', userId: 'sm-1', role: 'SOURCING_MANAGER' },
          { towerId: 't-1', userId: 'cm-1', role: 'CLOSING_MANAGER' },
          { towerId: 't-1', userId: 'se-1', role: 'SALES_EXECUTIVE' },
        ],
      });
      expect(res).toEqual({ success: true });
    });
  });

  describe('getTowerAssignments', () => {
    it('should fetch tower assignments with user details', async () => {
      mockPrisma.towerAssignment.findMany.mockResolvedValue([{ id: 'ta-1' }]);

      const res = await service.getTowerAssignments('t-1');

      expect(mockPrisma.towerAssignment.findMany).toHaveBeenCalledWith({
        where: { towerId: 't-1' },
        include: {
          user: {
            select: { id: true, name: true, role: { select: { code: true } } },
          },
        },
      });
      expect(res).toEqual([{ id: 'ta-1' }]);
    });
  });

  describe('assignProject', () => {
    it('should delete existing assignments, create new ones, and notify SM & CM', async () => {
      mockPrisma.projectAssignment.deleteMany.mockResolvedValue({});
      mockPrisma.projectAssignment.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Grand City',
      });

      const res = await service.assignProject('p-1', ['sm-1'], ['cm-1'], []);

      expect(mockPrisma.projectAssignment.deleteMany).toHaveBeenCalledWith({
        where: {
          projectId: 'p-1',
          role: {
            in: ['SOURCING_MANAGER', 'CLOSING_MANAGER', 'SALES_EXECUTIVE'],
          },
        },
      });
      expect(mockPrisma.projectAssignment.createMany).toHaveBeenCalledWith({
        data: [
          { projectId: 'p-1', userId: 'sm-1', role: 'SOURCING_MANAGER' },
          { projectId: 'p-1', userId: 'cm-1', role: 'CLOSING_MANAGER' },
        ],
      });
      expect(mockNotifs.createNotification).toHaveBeenCalledTimes(2);
      expect(res).toEqual({ success: true });
    });
  });

  describe('getProjectAssignments', () => {
    it('should fetch project assignments with user details', async () => {
      mockPrisma.projectAssignment.findMany.mockResolvedValue([{ id: 'pa-1' }]);

      const res = await service.getProjectAssignments('p-1');

      expect(mockPrisma.projectAssignment.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p-1' },
        include: {
          user: {
            select: { id: true, name: true, role: { select: { code: true } } },
          },
        },
      });
      expect(res).toEqual([{ id: 'pa-1' }]);
    });
  });
});
