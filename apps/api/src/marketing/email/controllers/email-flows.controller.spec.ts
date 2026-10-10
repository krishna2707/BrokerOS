import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));

import { EmailFlowsController } from './email-flows.controller.js';
import { EmailFlowsService } from '../services/email-flows.service.js';
import { EmailInboundService } from '../services/email-inbound.service.js';

describe('EmailFlowsController', () => {
  let controller: EmailFlowsController;
  let flowsService: jest.Mocked<Partial<EmailFlowsService>>;
  let inboundService: jest.Mocked<Partial<EmailInboundService>>;

  beforeEach(async () => {
    flowsService = {
      findAll: jest.fn().mockResolvedValue([{ id: 'flow-1' }]),
      findById: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      create: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      update: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'flow-1' }),
      duplicate: jest.fn().mockResolvedValue({ id: 'flow-copy-1' }),
      getFlowRuns: jest.fn().mockResolvedValue([{ id: 'run-1' }]),
    };
    inboundService = {
      simulateInboundReply: jest.fn().mockResolvedValue({ simulated: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailFlowsController],
      providers: [
        { provide: EmailFlowsService, useValue: flowsService },
        { provide: EmailInboundService, useValue: inboundService },
      ],
    }).compile();

    controller = module.get<EmailFlowsController>(EmailFlowsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());
  it('findAll ? delegates', async () => {
    await controller.findAll();
    expect(flowsService.findAll).toHaveBeenCalled();
  });
  it('findById ? delegates id', async () => {
    await controller.findById('flow-1');
    expect(flowsService.findById).toHaveBeenCalledWith('flow-1');
  });
  it('create ? delegates dto', async () => {
    await controller.create({ name: 'Flow A' });
    expect(flowsService.create).toHaveBeenCalled();
  });
  it('update ? delegates id and dto', async () => {
    await controller.update('flow-1', { name: 'Updated' });
    expect(flowsService.update).toHaveBeenCalledWith('flow-1', {
      name: 'Updated',
    });
  });
  it('delete ? delegates id', async () => {
    await controller.delete('flow-1');
    expect(flowsService.delete).toHaveBeenCalledWith('flow-1');
  });
  it('duplicate ? delegates id via flowsService.duplicate', async () => {
    await controller.duplicate('flow-1');
    expect(flowsService.duplicate).toHaveBeenCalledWith('flow-1');
  });
  it('clone ? delegates id via flowsService.duplicate', async () => {
    await controller.clone('flow-1');
    expect(flowsService.duplicate).toHaveBeenCalledWith('flow-1');
  });
  it('getFlowRuns ? delegates id', async () => {
    await controller.getFlowRuns('flow-1');
    expect(flowsService.getFlowRuns).toHaveBeenCalledWith('flow-1');
  });
  it('simulate ? calls simulateInboundReply with flowId merged into dto', async () => {
    await controller.simulate('flow-1', { bodyText: 'test' });
    expect(inboundService.simulateInboundReply).toHaveBeenCalledWith(
      expect.objectContaining({ flowId: 'flow-1', bodyText: 'test' }),
    );
  });
});
