jest.mock('@brokeros/constants', () => ({
  SAMPLE_CSV_CONTENT: 'name,email,phone\nRahul,rahul@example.com,+919876543210',
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SampleCsvController } from './sample-csv.controller.js';
import { SAMPLE_CSV_CONTENT } from '@brokeros/constants';

describe('SampleCsvController', () => {
  let controller: SampleCsvController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SampleCsvController],
    }).compile();

    controller = module.get<SampleCsvController>(SampleCsvController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadSampleCsv', () => {
    it('should set appropriate headers and send CSV content', () => {
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      controller.downloadSampleCsv(res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="sample_marketing_leads.csv"',
      );
      expect(res.send).toHaveBeenCalledWith(SAMPLE_CSV_CONTENT);
    });
  });
});
