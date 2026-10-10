import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
  Public: () => () => {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@brokeros/prisma', () => ({
  LeadStatus: { NEW: 'NEW', CONTACTED: 'CONTACTED' },
  LeadTemperature: { HOT: 'HOT', WARM: 'WARM', COLD: 'COLD' },
  PrismaClient: class {},
}));
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../notifications/notifications.service.js');

import { LeadsController } from './leads.controller.js';
import { LeadsService } from './leads.service.js';
import { LeadStatus } from '@brokeros/prisma';
import { GetLeadsFilterDto } from './dto/lead.dto.js';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  const mockLeadsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    bulkCreate: jest.fn(),
    assignLeads: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    uploadAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [{ provide: LeadsService, useValue: mockLeadsService }],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    service = module.get<LeadsService>(LeadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll with user context', async () => {
    const req = { user: { id: 'u-1', roleId: 'r-1' } };
    const query: GetLeadsFilterDto = { status: LeadStatus.CONTACTED };
    mockLeadsService.findAll.mockResolvedValue({ leads: [], total: 0 });

    const res = await controller.findAll(req, query);
    expect(service.findAll).toHaveBeenCalledWith({
      ...query,
      userId: 'u-1',
      roleId: 'r-1',
    });
    expect(res).toEqual({ leads: [], total: 0 });
  });

  it('should call createLead', async () => {
    const req = { user: { id: 'u-1' } };
    const data = { firstName: 'John', phone: '1234567890' };
    mockLeadsService.create.mockResolvedValue({ id: 'l-1', ...data });

    const res = await controller.createLead(req, data);
    expect(service.create).toHaveBeenCalledWith(data, 'u-1');
    expect(res.id).toBe('l-1');
  });

  it('should call bulkCreate', async () => {
    const req = { user: { id: 'u-1' } };
    const body = { leads: [{ firstName: 'L1', phone: '123' }] };
    mockLeadsService.bulkCreate.mockResolvedValue({ count: 1 });

    const res = await controller.bulkCreate(req, body);
    expect(service.bulkCreate).toHaveBeenCalledWith(body.leads, 'u-1');
    expect(res).toEqual({ count: 1 });
  });

  it('should call assignLeads', async () => {
    const req = { user: { id: 'm-1' } };
    const body = { leadIds: ['l-1'], targetUserId: 'u-2' };
    mockLeadsService.assignLeads.mockResolvedValue({ assignedCount: 1 });

    const res = await controller.assignLeads(req, body);
    expect(service.assignLeads).toHaveBeenCalledWith(
      ['l-1'],
      'm-1',
      'u-2',
      undefined,
    );
    expect(res.assignedCount).toBe(1);
  });

  it('should call findOne with user context', async () => {
    const req = { user: { id: 'u-1', roleId: 'r-1' } };
    mockLeadsService.findOne.mockResolvedValue({ id: 'l-1' });

    const res = await controller.findOne(req, 'l-1');
    expect(service.findOne).toHaveBeenCalledWith('l-1', 'u-1', 'r-1');
    expect(res).toEqual({ id: 'l-1' });
  });

  it('should call updateStatus', async () => {
    const body = { status: LeadStatus.CONTACTED, subStatus: 'CALL_DONE' };
    mockLeadsService.updateStatus.mockResolvedValue({
      id: 'l-1',
      status: LeadStatus.CONTACTED,
    });

    const res = await controller.updateStatus('l-1', body);
    expect(service.updateStatus).toHaveBeenCalledWith(
      'l-1',
      LeadStatus.CONTACTED,
      'CALL_DONE',
    );
    expect(res.status).toBe(LeadStatus.CONTACTED);
  });

  it('should call update', async () => {
    const body = { firstName: 'Updated' };
    mockLeadsService.update.mockResolvedValue({
      id: 'l-1',
      firstName: 'Updated',
    });

    const res = await controller.update('l-1', body);
    expect(service.update).toHaveBeenCalledWith('l-1', body);
    expect(res.firstName).toBe('Updated');
  });

  it('should call uploadAvatar', async () => {
    const file = { originalname: 'pic.jpg' } as Express.Multer.File;
    mockLeadsService.uploadAvatar.mockResolvedValue({
      id: 'l-1',
      avatar: 'pic.jpg',
    });

    const res = await controller.uploadAvatar('l-1', file);
    expect(service.uploadAvatar).toHaveBeenCalledWith('l-1', file);
    expect(res.avatar).toBe('pic.jpg');
  });
});
