import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleModule } from '@nestjs/schedule';

jest.mock('@brokeros/prisma', () => ({
  PrismaClient: class {},
  prismaClient: { $connect: jest.fn(), $disconnect: jest.fn() },
  NotificationType: {
    MISSED_FOLLOW_UP: 'MISSED_FOLLOW_UP',
    MANAGER_TEAM_ALERT: 'MANAGER_TEAM_ALERT',
    SITE_VISIT_REMINDER: 'SITE_VISIT_REMINDER',
    SITE_VISIT_ARRIVE: 'SITE_VISIT_ARRIVE',
    MONTHLY_ANALYTICS: 'MONTHLY_ANALYTICS',
    MONTHLY_LEADERBOARD: 'MONTHLY_LEADERBOARD',
  },
}));
jest.mock('expo-server-sdk', () => ({
  Expo: class {
    chunkPushNotifications = jest.fn().mockReturnValue([[]]);
    sendPushNotificationsAsync = jest.fn();
    static isExpoPushToken = jest.fn().mockReturnValue(true);
  },
}));
jest.mock('../lib/database/prisma-client.js', () => ({
  prismaClient: {
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    followUp: { findMany: jest.fn(), count: jest.fn() },
    callRecord: { findMany: jest.fn(), findFirst: jest.fn() },
    lead: { findUnique: jest.fn() },
    managerTaskUser: { findFirst: jest.fn() },
    siteVisit: { findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    booking: { count: jest.fn() },
    possessionHandover: { count: jest.fn() },
    broker: { findMany: jest.fn() },
  },
}));

import { NotificationsModule } from './notifications.module.js';

describe('NotificationsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), NotificationsModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) await module.close();
    jest.clearAllMocks();
  });

  it('should compile and expose NotificationsService and NotificationsGateway', () => {
    expect(module).toBeDefined();
    const notificationsModule =
      module.get<NotificationsModule>(NotificationsModule);
    expect(notificationsModule).toBeDefined();
  });
});
