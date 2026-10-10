import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));
import { GoogleWebhooksController } from './google-webhooks.controller.js';
import { GoogleLeadsService } from '../services/google-leads.service.js';

describe('GoogleWebhooksController', () => {
  let controller: GoogleWebhooksController;
  let leadsService: jest.Mocked<Partial<GoogleLeadsService>>;

  beforeEach(async () => {
    leadsService = {
      processLeadWebhook: jest
        .fn()
        .mockResolvedValue({ processed: true } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleWebhooksController],
      providers: [{ provide: GoogleLeadsService, useValue: leadsService }],
    }).compile();

    controller = module.get<GoogleWebhooksController>(GoogleWebhooksController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('handleInboundLead ? dispatches webhook payload and responds with EVENT_RECEIVED', async () => {
    const payload = { lead_id: 'g-lead-1', user_column_data: [] };
    const res = await controller.handleInboundLead(payload);

    expect(leadsService.processLeadWebhook).toHaveBeenCalledWith(payload);
    expect(res).toEqual({ status: 'EVENT_RECEIVED' });
  });
});
