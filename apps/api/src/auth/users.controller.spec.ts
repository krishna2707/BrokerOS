import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
  Public: () => () => {},
}));
jest.mock('../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { UsersController } from './users.controller.js';
import { PrismaService } from '../lib/database/prisma.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let prismaService: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get subordinates for logged in manager', async () => {
    const subordinates = [
      {
        id: 'u-1',
        name: 'Agent One',
        email: 'one@example.com',
        role: { code: 'SALES_EXECUTIVE', name: 'Sales Executive' },
      },
    ];

    mockPrisma.user.findMany.mockResolvedValue(subordinates);

    const req = { user: { id: 'm-1' } };
    const result = await controller.getSubordinates(req);

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { managerId: 'm-1' },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { code: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(subordinates);
  });
});
