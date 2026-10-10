import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule } from '@nestjs/schedule';

jest.mock('@brokeros/prisma', () => ({
  ApprovalType: {
    DISCOUNT: 'DISCOUNT',
    PAYMENT_PLAN: 'PAYMENT_PLAN',
    COMMISSION: 'COMMISSION',
    GENERAL: 'GENERAL',
  },
  PrismaClient: class {},
  prismaClient: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/storage', () => ({ uploadFileToBlob: jest.fn() }));
jest.mock('../lib/storage/storage.service.js', () => ({
  StorageService: jest.fn().mockImplementation(() => ({})),
}));

import { ApprovalsModule } from './approvals.module.js';

describe('ApprovalsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), ApprovalsModule],
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
    const approvalsModule = module.get<ApprovalsModule>(ApprovalsModule);
    expect(approvalsModule).toBeDefined();
  });
});
