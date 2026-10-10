import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  LeadStatus: { NEW: 'NEW', CONTACTED: 'CONTACTED' },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { LeadsService } from './leads.service.js';
import { LeadsQueryService } from './leads-query.service.js';
import { LeadsManagementService } from './leads-management.service.js';
import { LeadsMediaService } from './leads-media.service.js';
import { LeadStatus } from '@brokeros/prisma';
import {
  CreateLeadDto,
  UpdateLeadDto,
  GetLeadsFilterDto,
} from './dto/lead.dto.js';

describe('LeadsService', () => {
  let service: LeadsService;
  let leadsQuery: LeadsQueryService;
  let leadsManagement: LeadsManagementService;
  let leadsMedia: LeadsMediaService;

  const mockQueryService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockManagementService = {
    bulkCreate: jest.fn(),
    assignLeads: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockMediaService = {
    uploadAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: LeadsQueryService, useValue: mockQueryService },
        { provide: LeadsManagementService, useValue: mockManagementService },
        { provide: LeadsMediaService, useValue: mockMediaService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    leadsQuery = module.get<LeadsQueryService>(LeadsQueryService);
    leadsManagement = module.get<LeadsManagementService>(
      LeadsManagementService,
    );
    leadsMedia = module.get<LeadsMediaService>(LeadsMediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate findAll to leadsQuery', async () => {
    const filters: GetLeadsFilterDto = { status: LeadStatus.CONTACTED };
    const expected = [{ id: 'l-1' }];
    mockQueryService.findAll.mockResolvedValue(expected);

    const result = await service.findAll(filters);
    expect(leadsQuery.findAll).toHaveBeenCalledWith(filters);
    expect(result).toEqual(expected);
  });

  it('should delegate findOne to leadsQuery', async () => {
    const expected = { id: 'l-1' };
    mockQueryService.findOne.mockResolvedValue(expected);

    const result = await service.findOne('l-1', 'u-1', 'r-1');
    expect(leadsQuery.findOne).toHaveBeenCalledWith('l-1', 'u-1', 'r-1');
    expect(result).toEqual(expected);
  });

  it('should delegate bulkCreate to leadsManagement', async () => {
    const leads: CreateLeadDto[] = [{ firstName: 'Lead 1', phone: '123' }];
    const expected = { success: true, count: 1 };
    mockManagementService.bulkCreate.mockResolvedValue(expected);

    const result = await service.bulkCreate(leads, 'mgr-1');
    expect(leadsManagement.bulkCreate).toHaveBeenCalledWith(leads, 'mgr-1');
    expect(result).toEqual(expected);
  });

  it('should delegate assignLeads to leadsManagement', async () => {
    const expected = { success: true, assignedCount: 2 };
    mockManagementService.assignLeads.mockResolvedValue(expected);

    const result = await service.assignLeads(
      ['l-1', 'l-2'],
      'mgr-1',
      'u-2',
      false,
    );
    expect(leadsManagement.assignLeads).toHaveBeenCalledWith(
      ['l-1', 'l-2'],
      'mgr-1',
      'u-2',
      false,
    );
    expect(result).toEqual(expected);
  });

  it('should delegate updateStatus to leadsManagement', async () => {
    const expected = { id: 'l-1', status: LeadStatus.CONTACTED };
    mockManagementService.updateStatus.mockResolvedValue(expected);

    const result = await service.updateStatus(
      'l-1',
      LeadStatus.CONTACTED,
      'DONE',
    );
    expect(leadsManagement.updateStatus).toHaveBeenCalledWith(
      'l-1',
      LeadStatus.CONTACTED,
      'DONE',
    );
    expect(result).toEqual(expected);
  });

  it('should delegate create to leadsManagement', async () => {
    const data: CreateLeadDto = { firstName: 'New', phone: '999' };
    const expected = { id: 'l-new', firstName: 'New' };
    mockManagementService.create.mockResolvedValue(expected);

    const result = await service.create(data, 'creator-1');
    expect(leadsManagement.create).toHaveBeenCalledWith(data, 'creator-1');
    expect(result).toEqual(expected);
  });

  it('should delegate update to leadsManagement', async () => {
    const data: UpdateLeadDto = { firstName: 'Updated' };
    const expected = { id: 'l-1', firstName: 'Updated' };
    mockManagementService.update.mockResolvedValue(expected);

    const result = await service.update('l-1', data);
    expect(leadsManagement.update).toHaveBeenCalledWith('l-1', data);
    expect(result).toEqual(expected);
  });

  it('should delegate uploadAvatar to leadsMedia', async () => {
    const file = {
      buffer: Buffer.from(''),
      originalname: 'avatar.png',
    } as Express.Multer.File;
    const expected = { id: 'l-1', avatar: 'url' };
    mockMediaService.uploadAvatar.mockResolvedValue(expected);

    const result = await service.uploadAvatar('l-1', file);
    expect(leadsMedia.uploadAvatar).toHaveBeenCalledWith('l-1', file);
    expect(result).toEqual(expected);
  });
});
