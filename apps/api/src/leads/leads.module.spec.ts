import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule } from '@nestjs/schedule';

jest.mock('@brokeros/prisma', () => ({
  NotificationType: { LEAD_ASSIGNED: 'LEAD_ASSIGNED' },
  LeadStatus: { NEW: 'NEW', CONTACTED: 'CONTACTED' },
  LeadTemperature: { HOT: 'HOT', WARM: 'WARM', COLD: 'COLD' },
  FollowUpStatus: { SCHEDULED: 'SCHEDULED' },
  SiteVisitStatus: { SCHEDULED: 'SCHEDULED' },
  CustomerInterestLevel: { HIGH: 'HIGH' },
  PrismaClient: class {},
  prismaClient: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('p-queue', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  }));
});
jest.mock('@brokeros/storage', () => ({ uploadFileToBlob: jest.fn() }));
jest.mock('../lib/storage/storage.service.js', () => ({
  StorageService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../notifications/notifications.service.js');
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
  Public: () => () => {},
}));

import { LeadsModule } from './leads.module.js';

describe('LeadsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), LeadsModule],
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
    const leadsModule = module.get<LeadsModule>(LeadsModule);
    expect(leadsModule).toBeDefined();
  });
});
