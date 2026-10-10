import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('@brokeros/prisma', () => ({
  ApprovalType: {
    DISCOUNT: 'DISCOUNT',
    PAYMENT_PLAN: 'PAYMENT_PLAN',
    COMMISSION: 'COMMISSION',
    GENERAL: 'GENERAL',
  },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@vercel/blob', () => ({
  put: jest
    .fn()
    .mockResolvedValue({ url: 'https://blob.vercel.com/approval-doc.pdf' }),
}));

import { ApprovalsController } from './approvals.controller.js';
import { ApprovalsService } from './approvals.service.js';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;
  let service: {
    createRequest: jest.Mock;
    getRequests: jest.Mock;
    getRequestDetails: jest.Mock;
    addMessage: jest.Mock;
    closeRequest: jest.Mock;
    redoRequestDecision: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createRequest: jest.fn(),
      getRequests: jest.fn(),
      getRequestDetails: jest.fn(),
      addMessage: jest.fn(),
      closeRequest: jest.fn(),
      redoRequestDecision: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [{ provide: ApprovalsService, useValue: service }],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return null url if file is missing', async () => {
      const res = await controller.uploadFile(null as any);
      expect(res).toEqual({ url: null });
    });

    it('should upload file to vercel blob and return url', async () => {
      const file = {
        originalname: 'discount.pdf',
        buffer: Buffer.from('data'),
      } as any;

      const res = await controller.uploadFile(file);

      expect(res).toEqual({ url: 'https://blob.vercel.com/approval-doc.pdf' });
    });
  });

  describe('createRequest', () => {
    it('should throw UnauthorizedException if req.user is missing', async () => {
      await expect(controller.createRequest({}, {} as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call approvalsService.createRequest with user id', async () => {
      service.createRequest.mockResolvedValue({ id: 'appr-1' });
      const req = { user: { id: 'u-1' } };
      const body = { type: 'DISCOUNT', reason: 'VIP' } as any;

      const res = await controller.createRequest(req, body);

      expect(service.createRequest).toHaveBeenCalledWith('u-1', body);
      expect(res).toEqual({ id: 'appr-1' });
    });
  });

  describe('getRequests', () => {
    it('should throw UnauthorizedException if req.user is missing', async () => {
      await expect(controller.getRequests({})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call approvalsService.getRequests with user id', async () => {
      service.getRequests.mockResolvedValue([{ id: 'appr-1' }]);
      const req = { user: { id: 'u-1' } };

      const res = await controller.getRequests(req);

      expect(service.getRequests).toHaveBeenCalledWith('u-1');
      expect(res).toEqual([{ id: 'appr-1' }]);
    });
  });

  describe('getRequestDetails', () => {
    it('should call approvalsService.getRequestDetails', async () => {
      service.getRequestDetails.mockResolvedValue({ id: 'appr-1' });

      const res = await controller.getRequestDetails('appr-1');

      expect(service.getRequestDetails).toHaveBeenCalledWith('appr-1');
      expect(res).toEqual({ id: 'appr-1' });
    });
  });

  describe('addMessage', () => {
    it('should throw UnauthorizedException if req.user is missing', async () => {
      await expect(
        controller.addMessage('appr-1', {}, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call approvalsService.addMessage with params', async () => {
      service.addMessage.mockResolvedValue({ id: 'msg-1' });
      const req = { user: { id: 'u-1' } };
      const body = { message: 'Approved 2%' } as any;

      const res = await controller.addMessage('appr-1', req, body);

      expect(service.addMessage).toHaveBeenCalledWith('appr-1', 'u-1', body);
      expect(res).toEqual({ id: 'msg-1' });
    });
  });

  describe('closeRequest', () => {
    it('should call approvalsService.closeRequest', async () => {
      service.closeRequest.mockResolvedValue({
        id: 'appr-1',
        status: 'CLOSED',
      });

      const res = await controller.closeRequest('appr-1');

      expect(service.closeRequest).toHaveBeenCalledWith('appr-1');
      expect(res).toEqual({ id: 'appr-1', status: 'CLOSED' });
    });
  });

  describe('redoRequestDecision', () => {
    it('should throw UnauthorizedException if req.user is missing', async () => {
      await expect(
        controller.redoRequestDecision('appr-1', {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call approvalsService.redoRequestDecision with params', async () => {
      service.redoRequestDecision.mockResolvedValue({
        id: 'appr-1',
        status: 'PENDING',
      });
      const req = { user: { id: 'u-1' } };

      const res = await controller.redoRequestDecision('appr-1', req);

      expect(service.redoRequestDecision).toHaveBeenCalledWith('appr-1', 'u-1');
      expect(res).toEqual({ id: 'appr-1', status: 'PENDING' });
    });
  });
});
