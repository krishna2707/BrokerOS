import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../lib/database/prisma-client.js', () => ({
  prismaClient: {
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}));

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    getUserNotifications: jest.Mock;
    markAsRead: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -- GET /api/notifications -------------------------------------------------

  describe('getUserNotifications', () => {
    it('should return empty array if user is missing', async () => {
      const res = await controller.getUserNotifications({
        user: undefined,
      } as any);
      expect(res).toEqual([]);
      expect(service.getUserNotifications).not.toHaveBeenCalled();
    });

    it('should delegate to notificationsService.getUserNotifications', async () => {
      const notifications = [{ id: 'n-1', title: 'Test' }];
      service.getUserNotifications.mockResolvedValue(notifications);

      const res = await controller.getUserNotifications({
        user: { id: 'u-1' },
      } as any);

      expect(service.getUserNotifications).toHaveBeenCalledWith('u-1');
      expect(res).toEqual(notifications);
    });
  });

  // -- PATCH /api/notifications/:id/read -------------------------------------

  describe('markAsRead', () => {
    it('should throw error if user is missing', async () => {
      await expect(
        controller.markAsRead('n-1', { user: undefined } as any),
      ).rejects.toThrow('Unauthorized');
    });

    it('should mark notification as read', async () => {
      service.markAsRead.mockResolvedValue({ count: 1 });

      const res = await controller.markAsRead('n-1', {
        user: { id: 'u-1' },
      } as any);

      expect(service.markAsRead).toHaveBeenCalledWith('n-1', 'u-1');
      expect(res).toEqual({ count: 1 });
    });
  });
});
