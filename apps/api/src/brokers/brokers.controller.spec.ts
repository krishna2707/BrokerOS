import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
}));

import { BrokersController } from './brokers.controller.js';
import { BrokersService } from './brokers.service.js';
import { BrokerActivitiesService } from './broker-activities.service.js';
import { BrokerCommissionsService } from './broker-commissions.service.js';
import { BrokerAiService } from './broker-ai.service.js';

describe('BrokersController', () => {
  let controller: BrokersController;
  let brokersService: {
    getBrokers: jest.Mock;
    getSourcingManagers: jest.Mock;
    getBrokerById: jest.Mock;
    createBroker: jest.Mock;
    updateBroker: jest.Mock;
    updateDealCard: jest.Mock;
  };
  let activitiesService: {
    addNote: jest.Mock;
    addFollowUp: jest.Mock;
    addMeeting: jest.Mock;
    arriveAtMeeting: jest.Mock;
    completeMeeting: jest.Mock;
    confirmFollowUp: jest.Mock;
  };
  let commissionsService: {
    getCommissions: jest.Mock;
    completeCommission: jest.Mock;
  };
  let aiService: {
    generateAiTransitionNote: jest.Mock;
  };

  beforeEach(async () => {
    brokersService = {
      getBrokers: jest.fn(),
      getSourcingManagers: jest.fn(),
      getBrokerById: jest.fn(),
      createBroker: jest.fn(),
      updateBroker: jest.fn(),
      updateDealCard: jest.fn(),
    };

    activitiesService = {
      addNote: jest.fn(),
      addFollowUp: jest.fn(),
      addMeeting: jest.fn(),
      arriveAtMeeting: jest.fn(),
      completeMeeting: jest.fn(),
      confirmFollowUp: jest.fn(),
    };

    commissionsService = {
      getCommissions: jest.fn(),
      completeCommission: jest.fn(),
    };

    aiService = {
      generateAiTransitionNote: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrokersController],
      providers: [
        { provide: BrokersService, useValue: brokersService },
        { provide: BrokerActivitiesService, useValue: activitiesService },
        { provide: BrokerCommissionsService, useValue: commissionsService },
        { provide: BrokerAiService, useValue: aiService },
      ],
    }).compile();

    controller = module.get<BrokersController>(BrokersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('brokers querying & CRUD', () => {
    it('should call getBrokers with user id and filters', async () => {
      brokersService.getBrokers.mockResolvedValue([{ id: 'b-1' }]);
      const req = { user: { id: 'u-1' } };

      const res = await controller.getBrokers(req, 'proj-1', '2026-09-22');

      expect(brokersService.getBrokers).toHaveBeenCalledWith(
        'u-1',
        'proj-1',
        '2026-09-22',
      );
      expect(res).toEqual([{ id: 'b-1' }]);
    });

    it('should call getSourcingManagers', async () => {
      brokersService.getSourcingManagers.mockResolvedValue([{ id: 'sm-1' }]);

      const res = await controller.getSourcingManagers();

      expect(brokersService.getSourcingManagers).toHaveBeenCalled();
      expect(res).toEqual([{ id: 'sm-1' }]);
    });

    it('should call getBrokerById', async () => {
      brokersService.getBrokerById.mockResolvedValue({ id: 'b-1' });
      const req = { user: { id: 'u-1' } };

      const res = await controller.getBrokerById('b-1', req);

      expect(brokersService.getBrokerById).toHaveBeenCalledWith('b-1', 'u-1');
      expect(res).toEqual({ id: 'b-1' });
    });

    it('should call createBroker', async () => {
      brokersService.createBroker.mockResolvedValue({ id: 'b-new' });
      const req = { user: { id: 'u-1' } };
      const body = { name: 'Rajesh Broker' } as any;

      const res = await controller.createBroker(body, req);

      expect(brokersService.createBroker).toHaveBeenCalledWith(body, 'u-1');
      expect(res).toEqual({ id: 'b-new' });
    });

    it('should call updateBroker', async () => {
      brokersService.updateBroker.mockResolvedValue({ id: 'b-1' });
      const req = { user: { id: 'u-1' } };
      const body = { phone: '9876543210' } as any;

      const res = await controller.updateBroker('b-1', body, req);

      expect(brokersService.updateBroker).toHaveBeenCalledWith(
        'b-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'b-1' });
    });

    it('should call updateDealCard', async () => {
      brokersService.updateDealCard.mockResolvedValue({ id: 'b-1' });
      const req = { user: { id: 'u-1' } };
      const body = { stage: 'MEETING_COMPLETED' } as any;

      const res = await controller.updateDealCard('b-1', body, req);

      expect(brokersService.updateDealCard).toHaveBeenCalledWith(
        'b-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'b-1' });
    });
  });

  describe('activities and meetings', () => {
    it('should call addNote', async () => {
      activitiesService.addNote.mockResolvedValue({ id: 'n-1' });
      const req = { user: { id: 'u-1' } };
      const body = { content: 'Good discussion' } as any;

      const res = await controller.addNote('b-1', body, req);

      expect(activitiesService.addNote).toHaveBeenCalledWith(
        'b-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'n-1' });
    });

    it('should call addFollowUp', async () => {
      activitiesService.addFollowUp.mockResolvedValue({ id: 'f-1' });
      const req = { user: { id: 'u-1' } };
      const body = { scheduledDate: '2026-09-25' } as any;

      const res = await controller.addFollowUp('b-1', body, req);

      expect(activitiesService.addFollowUp).toHaveBeenCalledWith(
        'b-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'f-1' });
    });

    it('should call addMeeting', async () => {
      activitiesService.addMeeting.mockResolvedValue({ id: 'm-1' });
      const req = { user: { id: 'u-1' } };
      const body = { scheduledDate: '2026-09-25' } as any;

      const res = await controller.addMeeting('b-1', body, req);

      expect(activitiesService.addMeeting).toHaveBeenCalledWith(
        'b-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'm-1' });
    });

    it('should call arriveAtMeeting', async () => {
      activitiesService.arriveAtMeeting.mockResolvedValue({
        id: 'm-1',
        arrived: true,
      });
      const req = { user: { id: 'u-1' } };
      const body = { latitude: 12.97, longitude: 77.59 } as any;

      const res = await controller.arriveAtMeeting('b-1', 'm-1', req, body);

      expect(activitiesService.arriveAtMeeting).toHaveBeenCalledWith(
        'b-1',
        'm-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'm-1', arrived: true });
    });

    it('should call completeMeeting', async () => {
      activitiesService.completeMeeting.mockResolvedValue({
        id: 'm-1',
        status: 'COMPLETED',
      });
      const req = { user: { id: 'u-1' } };
      const body = { notes: 'Signed agreement' } as any;

      const res = await controller.completeMeeting('b-1', 'm-1', req, body);

      expect(activitiesService.completeMeeting).toHaveBeenCalledWith(
        'b-1',
        'm-1',
        'u-1',
        body,
      );
      expect(res).toEqual({ id: 'm-1', status: 'COMPLETED' });
    });

    it('should call confirmFollowUp', async () => {
      activitiesService.confirmFollowUp.mockResolvedValue({
        id: 'f-1',
        confirmed: true,
      });
      const req = { user: { id: 'u-1' } };

      const res = await controller.confirmFollowUp('b-1', 'f-1', req);

      expect(activitiesService.confirmFollowUp).toHaveBeenCalledWith(
        'b-1',
        'f-1',
        'u-1',
      );
      expect(res).toEqual({ id: 'f-1', confirmed: true });
    });
  });

  describe('commissions and AI', () => {
    it('should call getCommissions', async () => {
      commissionsService.getCommissions.mockResolvedValue([{ id: 'c-1' }]);
      const req = { user: { id: 'u-1' } };

      const res = await controller.getCommissions(req);

      expect(commissionsService.getCommissions).toHaveBeenCalledWith('u-1');
      expect(res).toEqual([{ id: 'c-1' }]);
    });

    it('should call completeCommission with file', async () => {
      commissionsService.completeCommission.mockResolvedValue({
        success: true,
      });
      const req = { user: { id: 'u-1' } };
      const file = { originalname: 'receipt.pdf' } as any;

      const res = await controller.completeCommission('rec-1', req, file);

      expect(commissionsService.completeCommission).toHaveBeenCalledWith(
        'rec-1',
        'u-1',
        file,
      );
      expect(res).toEqual({ success: true });
    });

    it('should call generateAiTransitionNote', async () => {
      aiService.generateAiTransitionNote.mockResolvedValue({
        note: 'AI summary',
      });
      const req = { user: { id: 'u-1' } };

      const res = await controller.generateAiTransitionNote('b-1', req);

      expect(aiService.generateAiTransitionNote).toHaveBeenCalledWith(
        'b-1',
        'u-1',
      );
      expect(res).toEqual({ note: 'AI summary' });
    });
  });
});
