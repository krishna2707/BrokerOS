import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  NotificationType: { LEAD_ASSIGNED: 'LEAD_ASSIGNED' },
  LeadStatus: {
    NEW: 'NEW',
    HANDOVER: 'HANDOVER',
    INTERESTED: 'INTERESTED',
    CONTACTED: 'CONTACTED',
  },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../../notifications/notifications.service.js');
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { LeadsManagementService } from './leads-management.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto.js';
import { LeadStatus } from '@brokeros/prisma';
import { NotFoundException } from '@nestjs/common';

describe('LeadsManagementService', () => {
  let service: LeadsManagementService;
  const mockPrisma = {
    leadSource: { findMany: jest.fn(), findFirst: jest.fn() },
    project: { findMany: jest.fn() },
    lead: {
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: { findMany: jest.fn() },
    booking: { findFirst: jest.fn() },
    unit: { update: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };
  const mockNotifs = { createNotification: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsManagementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifs },
      ],
    }).compile();
    service = module.get(LeadsManagementService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should bulk create leads', async () => {
    mockPrisma.leadSource.findMany.mockResolvedValue([]);
    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.lead.createMany.mockResolvedValue({ count: 2 });
    await service.bulkCreate(
      [{ firstName: 'A' }, { firstName: 'B' }] as CreateLeadDto[],
      'm-1',
    );
    expect(mockPrisma.lead.createMany).toHaveBeenCalled();
    expect(mockNotifs.createNotification).toHaveBeenCalled();
  });

  it('should assign leads round robin', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'u-1' }, { id: 'u-2' }]);
    await service.assignLeads(['l-1', 'l-2'], 'm-1', undefined, true);
    expect(mockPrisma.lead.update).toHaveBeenCalledTimes(2);
  });

  it('should assign leads to target user directly', async () => {
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 2 });
    const res = await service.assignLeads(
      ['l-1', 'l-2'],
      'm-1',
      'target-u-1',
      false,
    );
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['l-1', 'l-2'] } },
      data: { assignedUserId: 'target-u-1' },
    });
    expect(res.assignedCount).toBe(2);
    expect(mockNotifs.createNotification).toHaveBeenCalled();
  });

  it('should update lead status and mark unit SOLD when HANDOVER DONE', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-1' });
    mockPrisma.lead.update.mockResolvedValue({
      id: 'l-1',
      status: LeadStatus.HANDOVER,
      subStatus: 'DONE',
    });
    mockPrisma.booking.findFirst.mockResolvedValue({
      id: 'b-1',
      unitId: 'unit-1',
    });
    mockPrisma.unit.update.mockResolvedValue({ id: 'unit-1', status: 'SOLD' });

    const result = await service.updateStatus(
      'l-1',
      LeadStatus.HANDOVER,
      'DONE',
    );

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'l-1' },
      data: { status: LeadStatus.HANDOVER, subStatus: 'DONE' },
    });
    expect(mockPrisma.unit.update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: { status: 'SOLD' },
    });
    expect(result.status).toBe(LeadStatus.HANDOVER);
  });

  it('should throw NotFoundException if updating status for nonexistent lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    await expect(
      service.updateStatus('nonexistent', LeadStatus.INTERESTED),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a single lead and resolve source name', async () => {
    mockPrisma.leadSource.findFirst.mockResolvedValue({
      id: 'src-1',
      name: 'Google',
    });
    mockPrisma.lead.create.mockResolvedValue({
      id: 'l-new',
      firstName: 'John',
      phone: '9876543210',
      sourceId: 'src-1',
    });

    const leadData: CreateLeadDto = {
      firstName: 'John',
      phone: '9876543210',
      source: 'Google',
    };

    const res = await service.create(leadData, 'user-creator');
    expect(mockPrisma.leadSource.findFirst).toHaveBeenCalled();
    expect(mockPrisma.lead.create).toHaveBeenCalled();
    expect(res.id).toBe('l-new');
  });

  it('should update lead details', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-1' });
    mockPrisma.lead.update.mockResolvedValue({
      id: 'l-1',
      firstName: 'Jane',
    });

    const updateData: UpdateLeadDto = { firstName: 'Jane' };
    const res = await service.update('l-1', updateData);
    expect(mockPrisma.lead.update).toHaveBeenCalled();
    expect(res.firstName).toBe('Jane');
  });
});
