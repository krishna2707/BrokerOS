jest.mock('@brokeros/int-whatsapp', () => ({
  getMediaUrl: jest.fn(),
  downloadMedia: jest.fn(),
}));

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WhatsAppMediaService } from './whatsapp-media.service.js';
import { WhatsAppConfigService } from '../config/whatsapp-config.service.js';
import { getMediaUrl, downloadMedia } from '@brokeros/int-whatsapp';
import { put } from '@vercel/blob';

describe('WhatsAppMediaService', () => {
  let service: WhatsAppMediaService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      getDecryptedAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppMediaService,
        { provide: WhatsAppConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WhatsAppMediaService>(WhatsAppMediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInboundMediaProxy', () => {
    it('should throw NotFoundException if account is not found', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue(null);

      await expect(
        service.getInboundMediaProxy('media-123', 'acc-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should download and return media buffer with contentType', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        accessToken: 'valid-token',
      });

      (getMediaUrl as jest.Mock).mockResolvedValue({
        url: 'https://lookaside.fbsbx.com/media/download',
        mimeType: 'image/jpeg',
      });

      const bufferMock = Buffer.from('fake image data');
      (downloadMedia as jest.Mock).mockResolvedValue({
        buffer: bufferMock,
        contentType: 'image/jpeg',
      });

      const res = await service.getInboundMediaProxy('media-123', 'acc-1');

      expect(getMediaUrl).toHaveBeenCalledWith({
        mediaId: 'media-123',
        accessToken: 'valid-token',
      });
      expect(downloadMedia).toHaveBeenCalledWith({
        downloadUrl: 'https://lookaside.fbsbx.com/media/download',
        accessToken: 'valid-token',
      });
      expect(res).toEqual({
        buffer: bufferMock,
        contentType: 'image/jpeg',
      });
    });

    it('should throw BadRequestException when downloadMedia fails', async () => {
      mockConfigService.getDecryptedAccount.mockResolvedValue({
        accessToken: 'valid-token',
      });

      (getMediaUrl as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.getInboundMediaProxy('media-123', 'acc-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadOutboundMedia', () => {
    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.uploadOutboundMedia(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload to Vercel Blob when BLOB_READ_WRITE_TOKEN is set', async () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      process.env.BLOB_READ_WRITE_TOKEN = 'blob_token_xyz';

      (put as jest.Mock).mockResolvedValue({
        url: 'https://blob.vercel-storage.com/whatsapp/uploaded.pdf',
      });

      try {
        const file = {
          buffer: Buffer.from('PDF data'),
          originalname: 'brochure.pdf',
          mimetype: 'application/pdf',
        };

        const res = await service.uploadOutboundMedia(file);

        expect(put).toHaveBeenCalledWith(
          expect.stringContaining('whatsapp/'),
          file.buffer,
          expect.objectContaining({
            access: 'public',
            contentType: 'application/pdf',
            token: 'blob_token_xyz',
          }),
        );
        expect(res).toEqual({
          url: 'https://blob.vercel-storage.com/whatsapp/uploaded.pdf',
        });
      } finally {
        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      }
    });

    it('should return base64 data URI when BLOB_READ_WRITE_TOKEN is missing', async () => {
      const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
      delete process.env.BLOB_READ_WRITE_TOKEN;

      try {
        const file = {
          buffer: Buffer.from('hello-world'),
          originalname: 'file.txt',
          mimetype: 'text/plain',
        };

        const res = await service.uploadOutboundMedia(file);
        expect(res.url).toMatch(/^data:text\/plain;base64,/);
      } finally {
        process.env.BLOB_READ_WRITE_TOKEN = originalToken;
      }
    });
  });
});
