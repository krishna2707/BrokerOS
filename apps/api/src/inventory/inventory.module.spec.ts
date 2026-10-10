import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule } from '@nestjs/schedule';

jest.mock('@brokeros/prisma', () => ({
  NotificationType: { PROJECT_ASSIGNED: 'PROJECT_ASSIGNED' },
  PrismaClient: class {},
  prismaClient: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  }));
});
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
  Public: () => () => {},
}));

import { InventoryModule } from './inventory.module.js';

describe('InventoryModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), InventoryModule],
    })
      .overrideProvider('PrismaService')
      .useValue({})
      .compile();
  });

  afterEach(async () => {
    if (module) await module.close();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    const inventoryModule = module.get<InventoryModule>(InventoryModule);
    expect(inventoryModule).toBeDefined();
  });
});
