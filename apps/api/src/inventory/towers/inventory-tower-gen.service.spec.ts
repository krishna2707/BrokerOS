import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

const mockChatCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
  }));
});

import { InventoryTowerGenService } from './inventory-tower-gen.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { SaveTowerDto, UnitTypeEnum } from './dto/tower.dto.js';

describe('InventoryTowerGenService', () => {
  let service: InventoryTowerGenService;
  const mockPrisma = {
    tower: { create: jest.fn() },
    floor: { create: jest.fn() },
    unit: { createMany: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryTowerGenService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InventoryTowerGenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTowerPrompt', () => {
    it('should throw BadRequestException if groq is not initialized', async () => {
      // Force groq to null
      (service as any).groq = null;

      await expect(
        service.generateTowerPrompt('p-1', 'Generate a 10 floor tower'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate tower JSON structure', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [
          { message: { content: '{"name": "Tower Alpha", "floors": []}' } },
        ],
      });

      const res = await service.generateTowerPrompt('p-1', 'Generate a tower');

      expect(res).toEqual({ name: 'Tower Alpha', floors: [] });
      expect(mockChatCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({
              role: 'user',
              content: 'Generate a tower',
            }),
          ]),
          model: 'openai/gpt-oss-120b',
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should throw Error if AI does not return content', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(
        service.generateTowerPrompt('p-1', 'prompt'),
      ).rejects.toThrow('AI failed to generate response');
    });
  });

  describe('saveGeneratedTower', () => {
    it('should save tower, floors, and units with sanitized types and parsed numbers', async () => {
      mockPrisma.tower.create.mockResolvedValue({
        id: 'tower-1',
        name: 'Tower Alpha',
      });
      mockPrisma.floor.create.mockResolvedValue({
        id: 'floor-1',
      });
      mockPrisma.unit.createMany.mockResolvedValue({ count: 2 });

      const dto = {
        name: 'Tower Alpha',
        floors: [
          {
            floorNumber: 'Floor 1',
            name: 'First Floor',
            units: [
              {
                unitNumber: '101',
                type: 'INVALID_TYPE_ENUM', // will fallback to STUDIO
                basePrice: '1,500,000',
                carpetArea: '1,250.50',
                commissionPercentage: '2.5%',
                facing: 'North',
              },
              {
                unitNumber: '102',
                type: UnitTypeEnum.TWO_BHK,
                basePrice: 2000000,
                carpetArea: 1400,
              },
            ],
          },
        ],
      } as any;

      const res = await service.saveGeneratedTower('proj-1', dto);

      expect(mockPrisma.tower.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          name: 'Tower Alpha',
          totalFloors: 1,
          totalUnits: 2,
        },
      });

      expect(mockPrisma.floor.create).toHaveBeenCalledWith({
        data: {
          towerId: 'tower-1',
          floorNumber: 1,
          name: 'First Floor',
          totalUnits: 2,
        },
      });

      expect(mockPrisma.unit.createMany).toHaveBeenCalledWith({
        data: [
          {
            floorId: 'floor-1',
            unitNumber: '101',
            type: 'STUDIO',
            status: 'AVAILABLE',
            basePrice: 1500000,
            carpetArea: 1250.5,
            commissionPercentage: 2.5,
            facing: 'North',
          },
          {
            floorId: 'floor-1',
            unitNumber: '102',
            type: 'TWO_BHK',
            status: 'AVAILABLE',
            basePrice: 2000000,
            carpetArea: 1400,
            commissionPercentage: null,
            facing: null,
          },
        ],
      });

      expect(res.id).toBe('tower-1');
    });
  });
});
