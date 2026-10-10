import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  FollowUpStatus: {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    MISSED: 'MISSED',
  },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../../notifications/notifications.service.js');
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { FollowUpsController } from './follow-ups.controller.js';
import { FollowUpsService } from './follow-ups.service.js';

describe('FollowUpsController', () => {
  let controller: FollowUpsController;
  let service: FollowUpsService;

  const mockFollowUpsService = {
    getFollowUps: jest.fn(),
    createFollowUp: jest.fn(),
    updateFollowUp: jest.fn(),
    deleteFollowUp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowUpsController],
      providers: [
        { provide: FollowUpsService, useValue: mockFollowUpsService },
      ],
    }).compile();

    controller = module.get<FollowUpsController>(FollowUpsController);
    service = module.get<FollowUpsService>(FollowUpsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get follow-ups for a lead', async () => {
    const expected = [{ id: 'fu-1' }];
    mockFollowUpsService.getFollowUps.mockResolvedValue(expected);

    const res = await controller.getFollowUps('l-1');
    expect(service.getFollowUps).toHaveBeenCalledWith('l-1');
    expect(res).toEqual(expected);
  });

  it('should create follow-up', async () => {
    const data = { scheduledDate: new Date().toISOString(), type: 'CALL' };
    const expected = { id: 'fu-1', ...data };
    mockFollowUpsService.createFollowUp.mockResolvedValue(expected);

    const res = await controller.createFollowUp('l-1', data as any);
    expect(service.createFollowUp).toHaveBeenCalledWith('l-1', data);
    expect(res).toEqual(expected);
  });

  it('should update follow-up', async () => {
    const data = { remarks: 'Rescheduled' };
    const expected = { id: 'fu-1', remarks: 'Rescheduled' };
    mockFollowUpsService.updateFollowUp.mockResolvedValue(expected);

    const res = await controller.updateFollowUp('fu-1', data);
    expect(service.updateFollowUp).toHaveBeenCalledWith('fu-1', data);
    expect(res).toEqual(expected);
  });

  it('should delete follow-up', async () => {
    const expected = { id: 'fu-1' };
    mockFollowUpsService.deleteFollowUp.mockResolvedValue(expected);

    const res = await controller.deleteFollowUp('fu-1');
    expect(service.deleteFollowUp).toHaveBeenCalledWith('fu-1');
    expect(res).toEqual(expected);
  });
});
