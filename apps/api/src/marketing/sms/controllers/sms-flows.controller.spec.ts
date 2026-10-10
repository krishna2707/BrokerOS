import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/types', () => ({}));
jest.mock('@brokeros/constants', () => ({
  SMS_PROVIDER_PRICING_ESTIMATES: {},
  calculateSmsSegments: jest.fn(),
}));
import { SmsFlowsController } from './sms-flows.controller.js';
import { SmsFlowsService } from '../services/sms-flows.service.js';
import { SmsInboundService } from '../services/sms-inbound.service.js';
describe('SmsFlowsController', () => {
  let controller: SmsFlowsController;
  let flowsService: jest.Mocked<Partial<SmsFlowsService>>;
  let inboundService: jest.Mocked<Partial<SmsInboundService>>;
  beforeEach(async () => {
    flowsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      create: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      duplicate: jest.fn().mockResolvedValue({ id: 'copy' }),
      getFlowRuns: jest.fn().mockResolvedValue([]),
    };
    inboundService = {
      simulateInboundReply: jest.fn().mockResolvedValue({ simulated: true }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsFlowsController],
      providers: [
        { provide: SmsFlowsService, useValue: flowsService },
        { provide: SmsInboundService, useValue: inboundService },
      ],
    }).compile();
    controller = module.get<SmsFlowsController>(SmsFlowsController);
  });
  afterEach(() => jest.clearAllMocks());
  it('should be defined', () => expect(controller).toBeDefined());
  it('findAll', async () => {
    await controller.findAll();
    expect(flowsService.findAll).toHaveBeenCalled();
  });
  it('findById', async () => {
    await controller.findById('flow-1');
    expect(flowsService.findById).toHaveBeenCalledWith('flow-1');
  });
  it('create', async () => {
    await controller.create({ name: 'Flow' });
    expect(flowsService.create).toHaveBeenCalled();
  });
  it('update', async () => {
    await controller.update('flow-1', { name: 'Updated' });
    expect(flowsService.update).toHaveBeenCalledWith('flow-1', {
      name: 'Updated',
    });
  });
  it('delete', async () => {
    await controller.delete('flow-1');
    expect(flowsService.delete).toHaveBeenCalledWith('flow-1');
  });
  it('duplicate', async () => {
    await controller.duplicate('flow-1');
    expect(flowsService.duplicate).toHaveBeenCalledWith('flow-1');
  });
  it('clone', async () => {
    await controller.clone('flow-1');
    expect(flowsService.duplicate).toHaveBeenCalledWith('flow-1');
  });
  it('getFlowRuns', async () => {
    await controller.getFlowRuns('flow-1');
    expect(flowsService.getFlowRuns).toHaveBeenCalledWith('flow-1');
  });
  it('simulate calls simulateInboundReply with flowId merged', async () => {
    await controller.simulate('flow-1', { bodyText: 'pricing?' });
    expect(inboundService.simulateInboundReply).toHaveBeenCalledWith(
      expect.objectContaining({ flowId: 'flow-1', bodyText: 'pricing?' }),
    );
  });
});
