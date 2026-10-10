jest.mock('@thallesp/nestjs-better-auth', () => ({
  Public: () => () => {},
  AuthGuard: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WhatsAppMediaController } from './whatsapp-media.controller.js';
import { WhatsAppMediaService } from './whatsapp-media.service.js';

describe('WhatsAppMediaController', () => {
  let controller: WhatsAppMediaController;
  let mockMediaService: Partial<Record<keyof WhatsAppMediaService, jest.Mock>>;

  beforeEach(async () => {
    mockMediaService = {
      getInboundMediaProxy: jest.fn(),
      uploadOutboundMedia: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppMediaController],
      providers: [{ provide: WhatsAppMediaService, useValue: mockMediaService }],
    }).compile();

    controller = module.get<WhatsAppMediaController>(WhatsAppMediaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInboundMedia', () => {
    it('should throw BadRequestException if accountId is missing', async () => {
      const mockRes: any = {};
      await expect(
        controller.getInboundMedia('media-1', '', mockRes),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set headers and send binary buffer to response', async () => {
      const buffer = Buffer.from('test binary content');
      mockMediaService.getInboundMediaProxy!.mockResolvedValue({
        buffer,
        contentType: 'image/png',
      });

      const mockRes: any = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.getInboundMedia('media-1', 'acc-1', mockRes);

      expect(mockMediaService.getInboundMediaProxy).toHaveBeenCalledWith(
        'media-1',
        'acc-1',
      );
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=86400',
      });
      expect(mockRes.send).toHaveBeenCalledWith(buffer);
    });
  });

  describe('uploadMedia', () => {
    it('should delegate file to mediaService.uploadOutboundMedia', async () => {
      const file = {
        buffer: Buffer.from('file-bytes'),
        originalname: 'test.png',
        mimetype: 'image/png',
      };
      mockMediaService.uploadOutboundMedia!.mockResolvedValue({
        url: 'https://blob.vercel-storage.com/test.png',
      });

      const res = await controller.uploadMedia(file as any);
      expect(mockMediaService.uploadOutboundMedia).toHaveBeenCalledWith(file);
      expect(res).toEqual({ url: 'https://blob.vercel-storage.com/test.png' });
    });
  });
});
