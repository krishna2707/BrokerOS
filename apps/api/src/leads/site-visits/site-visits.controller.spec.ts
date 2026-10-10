import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  SiteVisitStatus: {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
  CustomerInterestLevel: { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
  PrismaClient: class {},
}));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('../../notifications/notifications.service.js');
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { SiteVisitsController } from './site-visits.controller.js';
import { SiteVisitsService } from './site-visits.service.js';

describe('SiteVisitsController', () => {
  let controller: SiteVisitsController;
  let service: SiteVisitsService;

  const mockSiteVisitsService = {
    getSiteVisits: jest.fn(),
    createSiteVisit: jest.fn(),
    updateSiteVisit: jest.fn(),
    deleteSiteVisit: jest.fn(),
    arriveAtSiteVisit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteVisitsController],
      providers: [
        { provide: SiteVisitsService, useValue: mockSiteVisitsService },
      ],
    }).compile();

    controller = module.get<SiteVisitsController>(SiteVisitsController);
    service = module.get<SiteVisitsService>(SiteVisitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get site visits for a lead', async () => {
    const expected = [{ id: 'sv-1' }];
    mockSiteVisitsService.getSiteVisits.mockResolvedValue(expected);

    const res = await controller.getSiteVisits('l-1');
    expect(service.getSiteVisits).toHaveBeenCalledWith('l-1');
    expect(res).toEqual(expected);
  });

  it('should create site visit', async () => {
    const data = { projectId: 'p-1', scheduledDate: new Date().toISOString() };
    const expected = { id: 'sv-1', ...data };
    mockSiteVisitsService.createSiteVisit.mockResolvedValue(expected);

    const res = await controller.createSiteVisit('l-1', data as any);
    expect(service.createSiteVisit).toHaveBeenCalledWith('l-1', data);
    expect(res).toEqual(expected);
  });

  it('should update site visit', async () => {
    const data = { feedback: 'Great property' };
    const expected = { id: 'sv-1', ...data };
    mockSiteVisitsService.updateSiteVisit.mockResolvedValue(expected);

    const res = await controller.updateSiteVisit('sv-1', data as any);
    expect(service.updateSiteVisit).toHaveBeenCalledWith('sv-1', data);
    expect(res).toEqual(expected);
  });

  it('should delete site visit', async () => {
    const expected = { id: 'sv-1' };
    mockSiteVisitsService.deleteSiteVisit.mockResolvedValue(expected);

    const res = await controller.deleteSiteVisit('sv-1');
    expect(service.deleteSiteVisit).toHaveBeenCalledWith('sv-1');
    expect(res).toEqual(expected);
  });

  it('should record arrival at site visit', async () => {
    const locationData = { latitude: 12.34, longitude: 56.78 };
    const expected = { id: 'sv-1', verified: true };
    mockSiteVisitsService.arriveAtSiteVisit.mockResolvedValue(expected);

    const res = await controller.arriveAtSiteVisit('sv-1', locationData);
    expect(service.arriveAtSiteVisit).toHaveBeenCalledWith(
      'sv-1',
      locationData,
    );
    expect(res).toEqual(expected);
  });
});
