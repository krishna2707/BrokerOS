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
jest.mock('@brokeros/storage', () => ({
  uploadFileToBlob: jest.fn().mockResolvedValue('https://blob.vercel.com/avatar.jpg'),
  fetchBlobBuffer: jest.fn().mockResolvedValue({
    buffer: Buffer.from('test-image-bytes'),
    contentType: 'image/jpeg',
  }),
}));

import { LeadsService } from './leads.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { LeadStatus } from '@brokeros/prisma';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto.js';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockPrisma = {
    leadSource: { findMany: jest.fn(), findFirst: jest.fn() },
    project: { findMany: jest.fn() },
    lead: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findMany: jest.fn(), findUnique: jest.fn() },
    role: { findUnique: jest.fn() },
    projectAssignment: { findMany: jest.fn() },
    booking: { findFirst: jest.fn() },
    unit: { update: jest.fn() },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  const mockNotifications = {
    createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should find all leads and map them properly', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
          status: LeadStatus.NEW,
          subStatus: null,
          score: 85,
          lastContactDate: null,
          nextFollowUpDate: null,
          createdAt: new Date(),
          assignedUser: { name: 'Agent Smith', username: 'asmith' },
          interestedProject: { id: 'p-1', name: 'Skyline', slug: 'skyline' },
          siteVisits: [],
          followUps: [],
          customer: null,
        },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('lead-1');
      expect(mockPrisma.lead.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return lead by id with formatted procession and audio urls', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'lead-1',
        firstName: 'Jane',
        callRecords: [
          { id: 'cr-1', recordingUrl: 'https://vercel-storage.com/rec.mp3' },
        ],
        customer: {
          bookings: [
            {
              unit: {
                constructionStatus: 'UNDER_CONSTRUCTION',
                possessionTimeline: '2027',
              },
            },
          ],
        },
      });

      const result = await service.findOne('lead-1');
      expect(result.id).toBe('lead-1');
      expect(result.callRecords[0].recordingUrl).toBe(
        '/api/leads/call-records/cr-1/audio',
      );
      expect(result.processionStatus).toBe('UNDER_CONSTRUCTION');
    });

    it('should throw NotFoundException when lead is not found', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a lead and resolve lead source if string name provided', async () => {
      mockPrisma.leadSource.findFirst.mockResolvedValue({
        id: 'src-1',
        name: 'Website',
      });
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-new',
        firstName: 'Alice',
        phone: '9876543210',
      });

      const dto: CreateLeadDto = {
        firstName: 'Alice',
        phone: '9876543210',
        source: 'Website',
      };

      const result = await service.create(dto, 'user-1');
      expect(result.id).toBe('lead-new');
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Alice',
            sourceId: 'src-1',
            createdById: 'user-1',
          }),
        }),
      );
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create leads and send notification if count > 0', async () => {
      mockPrisma.leadSource.findMany.mockResolvedValue([]);
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.lead.createMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkCreate(
        [
          { firstName: 'L1', phone: '111' },
          { firstName: 'L2', phone: '222' },
          { firstName: 'L3', phone: '333' },
        ],
        'mgr-1',
      );

      expect(result).toEqual({ success: true, count: 3 });
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mgr-1',
          metadata: { count: 3 },
        }),
      );
    });
  });

  describe('assignLeads', () => {
    it('should assign leads to target user and notify', async () => {
      mockPrisma.lead.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.assignLeads(
        ['l-1', 'l-2'],
        'mgr-1',
        'target-user',
      );

      expect(result).toEqual({ success: true, assignedCount: 2 });
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'target-user',
          metadata: { count: 2 },
        }),
      );
    });

    it('should round-robin assign leads to active subordinates', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'sub-1' },
        { id: 'sub-2' },
      ]);
      mockPrisma.lead.update.mockResolvedValue({});

      const result = await service.assignLeads(
        ['l-1', 'l-2', 'l-3'],
        'mgr-1',
        undefined,
        true,
      );

      expect(result).toEqual({ success: true, assignedCount: 3 });
      expect(mockPrisma.lead.update).toHaveBeenCalledTimes(3);
      expect(mockNotifications.createNotification).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status and mark unit SOLD on HANDOVER + DONE', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-1' });
      mockPrisma.lead.update.mockResolvedValue({
        id: 'l-1',
        status: LeadStatus.HANDOVER,
        subStatus: 'DONE',
      });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        unitId: 'unit-10',
      });
      mockPrisma.unit.update.mockResolvedValue({});

      const result = await service.updateStatus('l-1', LeadStatus.HANDOVER, 'DONE');
      expect(result.status).toBe(LeadStatus.HANDOVER);
      expect(mockPrisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-10' },
        data: { status: 'SOLD' },
      });
    });
  });

  describe('update', () => {
    it('should update lead fields', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-1' });
      mockPrisma.lead.update.mockResolvedValue({
        id: 'l-1',
        firstName: 'UpdatedName',
      });

      const dto: UpdateLeadDto = { firstName: 'UpdatedName' };
      const result = await service.update('l-1', dto);
      expect(result.firstName).toBe('UpdatedName');
    });
  });

  describe('uploadAvatar and getAvatarStream', () => {
    it('should upload avatar using @brokeros/storage and update database', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-1' });
      mockPrisma.lead.update.mockResolvedValue({
        id: 'l-1',
        avatar: 'https://blob.vercel.com/avatar.jpg',
      });

      const file = {
        buffer: Buffer.from('file-content'),
        originalname: 'photo.png',
      } as Express.Multer.File;

      const result = await service.uploadAvatar('l-1', file);
      expect(result.avatar).toBe('https://blob.vercel.com/avatar.jpg');
    });

    it('should get avatar stream returning buffer and contentType', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'l-1',
        avatar: 'https://blob.vercel.com/avatar.jpg',
      });

      const result = await service.getAvatarStream('l-1');
      expect(result).not.toBeNull();
      expect(result?.contentType).toBe('image/jpeg');
      expect(result?.buffer).toBeDefined();
    });

    it('should return null from getAvatarStream if lead has no avatar', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l-2', avatar: null });
      const result = await service.getAvatarStream('l-2');
      expect(result).toBeNull();
    });
  });
});
