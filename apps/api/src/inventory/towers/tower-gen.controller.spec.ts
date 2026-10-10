import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
}));

import { TowerGenController } from './tower-gen.controller.js';
import { InventoryService } from '../core/inventory.service.js';

describe('TowerGenController', () => {
  let controller: TowerGenController;
  let service: {
    generateTowerPrompt: jest.Mock;
    saveGeneratedTower: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      generateTowerPrompt: jest.fn(),
      saveGeneratedTower: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TowerGenController],
      providers: [{ provide: InventoryService, useValue: service }],
    }).compile();

    controller = module.get<TowerGenController>(TowerGenController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateTowerPrompt', () => {
    it('should call inventoryService.generateTowerPrompt with projectId and prompt', async () => {
      service.generateTowerPrompt.mockResolvedValue({ name: 'Tower 1' });

      const res = await controller.generateTowerPrompt('proj-1', {
        prompt: '10 floor building',
      });

      expect(service.generateTowerPrompt).toHaveBeenCalledWith(
        'proj-1',
        '10 floor building',
      );
      expect(res).toEqual({ name: 'Tower 1' });
    });
  });

  describe('saveGeneratedTower', () => {
    it('should call inventoryService.saveGeneratedTower with projectId and body', async () => {
      service.saveGeneratedTower.mockResolvedValue({ id: 't-1' });
      const towerData = { name: 'Tower 1', floors: [] };

      const res = await controller.saveGeneratedTower('proj-1', towerData);

      expect(service.saveGeneratedTower).toHaveBeenCalledWith(
        'proj-1',
        towerData,
      );
      expect(res).toEqual({ id: 't-1' });
    });
  });
});
