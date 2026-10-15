import { Test, TestingModule } from '@nestjs/testing';
jest.mock('../../lib/database/prisma-client.js', () => ({
  prismaClient: {},
}));
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: class {},
}));
jest.mock('@brokeros/prisma', () => ({
  PrismaClient: class {},
}));

import { PrismaService } from '../../lib/database/prisma.service.js';
import { DashboardAnalyticsEngineService } from './dashboard-analytics-engine.service.js';

describe('DashboardAnalyticsEngineService', () => {
  let service: DashboardAnalyticsEngineService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      dashboardCache: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      lead: {
        count: jest.fn().mockResolvedValue(10),
        groupBy: jest.fn().mockResolvedValue([
          { status: 'NEW', _count: { status: 5 } },
          { status: 'QUALIFIED', _count: { status: 3 } },
        ]),
      },
      followUp: {
        count: jest.fn().mockResolvedValue(4),
      },
      siteVisit: {
        count: jest.fn().mockResolvedValue(2),
      },
      booking: {
        count: jest.fn().mockResolvedValue(1),
      },
      negotiation: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardAnalyticsEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardAnalyticsEngineService>(
      DashboardAnalyticsEngineService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCompute (Caching Seam)', () => {
    it('returns cached value without calling compute if valid cache entry exists', async () => {
      const futureDate = new Date(Date.now() + 60000);
      mockPrisma.dashboardCache.findUnique.mockResolvedValue({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        period: 'today',
        value: { foo: 'bar' },
        expiresAt: futureDate,
      });

      const computeMock = jest.fn();

      const result = await service.getOrCompute({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        period: 'today',
        compute: computeMock,
      });

      expect(result).toEqual({ foo: 'bar' });
      expect(mockPrisma.dashboardCache.findUnique).toHaveBeenCalledTimes(1);
      expect(computeMock).not.toHaveBeenCalled();
      expect(mockPrisma.dashboardCache.upsert).not.toHaveBeenCalled();
    });

    it('executes compute and populates cache if cache misses', async () => {
      mockPrisma.dashboardCache.findUnique.mockResolvedValue(null);
      mockPrisma.dashboardCache.upsert.mockResolvedValue({});

      const computeMock = jest.fn().mockResolvedValue({ calculated: 42 });

      const result = await service.getOrCompute({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        period: 'today',
        ttlSeconds: 120,
        compute: computeMock,
      });

      expect(result).toEqual({ calculated: 42 });
      expect(computeMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            dashboardType: 'PRE_SALES',
            widgetKey: 'test_widget',
            period: 'today',
            value: { calculated: 42 },
          }),
        }),
      );
    });

    it('executes compute and updates cache if existing entry is expired', async () => {
      const pastDate = new Date(Date.now() - 60000); // expired 1 min ago
      mockPrisma.dashboardCache.findUnique.mockResolvedValue({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        period: 'today',
        value: { stale: true },
        expiresAt: pastDate,
      });
      mockPrisma.dashboardCache.upsert.mockResolvedValue({});

      const computeMock = jest.fn().mockResolvedValue({ fresh: true });

      const result = await service.getOrCompute({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        period: 'today',
        compute: computeMock,
      });

      expect(result).toEqual({ fresh: true });
      expect(computeMock).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledTimes(1);
    });

    it('gracefully falls back to compute if cache lookup throws error', async () => {
      mockPrisma.dashboardCache.findUnique.mockRejectedValue(
        new Error('DB connection drop'),
      );
      mockPrisma.dashboardCache.upsert.mockRejectedValue(
        new Error('DB write failed'),
      );

      const computeMock = jest.fn().mockResolvedValue({ fallback: true });

      const result = await service.getOrCompute({
        dashboardType: 'PRE_SALES',
        widgetKey: 'test_widget',
        compute: computeMock,
      });

      expect(result).toEqual({ fallback: true });
      expect(computeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Invalidation and Maintenance', () => {
    it('invalidates specified entries', async () => {
      mockPrisma.dashboardCache.deleteMany.mockResolvedValue({ count: 3 });

      const count = await service.invalidate('PRE_SALES', 'widgets:user1');
      expect(count).toBe(3);
      expect(mockPrisma.dashboardCache.deleteMany).toHaveBeenCalledWith({
        where: { dashboardType: 'PRE_SALES', widgetKey: 'widgets:user1' },
      });
    });

    it('invalidates user entries', async () => {
      mockPrisma.dashboardCache.deleteMany.mockResolvedValue({ count: 5 });

      const count = await service.invalidateUser('user-123');
      expect(count).toBe(5);
      expect(mockPrisma.dashboardCache.deleteMany).toHaveBeenCalledWith({
        where: { widgetKey: { contains: 'user-123' } },
      });
    });

    it('cleans expired entries', async () => {
      mockPrisma.dashboardCache.deleteMany.mockResolvedValue({ count: 12 });

      const count = await service.cleanExpired();
      expect(count).toBe(12);
      expect(mockPrisma.dashboardCache.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lte: expect.any(Date) } },
      });
    });
  });

  describe('Domain Aggregations', () => {
    it('getPreSalesWidgets computes all required widget counts and caches', async () => {
      mockPrisma.dashboardCache.findUnique.mockResolvedValue(null);
      mockPrisma.dashboardCache.upsert.mockResolvedValue({});

      const widgets = await service.getPreSalesWidgets('user-123');

      expect(widgets).toBeDefined();
      expect(widgets.newLeads).toBe(10);
      expect(widgets.todayFollowUps).toBe(4);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledTimes(1);
    });

    it('getPreSalesPipeline computes status breakdown and caches', async () => {
      mockPrisma.dashboardCache.findUnique.mockResolvedValue(null);
      mockPrisma.dashboardCache.upsert.mockResolvedValue({});

      const pipeline = await service.getPreSalesPipeline('user-123');

      expect(pipeline).toBeDefined();
      expect(pipeline['NEW']).toBe(5);
      expect(pipeline['QUALIFIED']).toBe(3);
      expect(pipeline['LOST']).toBe(0);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledTimes(1);
    });

    it('getSalesExecWidgets computes sales execution counts and caches', async () => {
      mockPrisma.dashboardCache.findUnique.mockResolvedValue(null);
      mockPrisma.dashboardCache.upsert.mockResolvedValue({});

      const widgets = await service.getSalesExecWidgets('user-456');

      expect(widgets).toBeDefined();
      expect(widgets.siteVisitsScheduled).toBe(2);
      expect(widgets.bookingsGenerated).toBe(1);
      expect(mockPrisma.dashboardCache.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
