import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {},
}));

import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: {
    getDocuments: jest.Mock;
    uploadDocument: jest.Mock;
    getDocument: jest.Mock;
    deleteDocument: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getDocuments: jest.fn(),
      uploadDocument: jest.fn(),
      getDocument: jest.fn(),
      deleteDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: service }],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDocuments', () => {
    it('should return all documents mapped with proxy URL for non-sales exec', async () => {
      service.getDocuments.mockResolvedValue([
        { id: 'd-1', title: 'Brochure', isPublic: true },
        { id: 'd-2', title: 'Internal', isPublic: false },
      ]);

      const req = { user: { roleId: 1 } };
      const result = await controller.getDocuments(req, 'proj-1');

      expect(service.getDocuments).toHaveBeenCalledWith('proj-1', undefined);
      expect(result).toHaveLength(2);
      expect(result[0].fileUrl).toBe(
        '/api/proxy/api/inventory/projects/proj-1/documents/d-1/file',
      );
    });

    it('should filter only public documents for sales executive (roleId === 2)', async () => {
      service.getDocuments.mockResolvedValue([
        { id: 'd-1', title: 'Brochure', isPublic: true },
        { id: 'd-2', title: 'Internal', isPublic: false },
      ]);

      const req = { user: { roleId: 2 } };
      const result = await controller.getDocuments(req, 'proj-1', 'tower-1');

      expect(service.getDocuments).toHaveBeenCalledWith('proj-1', 'tower-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d-1');
    });
  });

  describe('uploadDocument', () => {
    it('should call documentsService.uploadDocument', async () => {
      const file = { buffer: Buffer.from('data') };
      const body = { title: 'Pricing Sheet', category: 'PRICE_SHEET' } as any;
      service.uploadDocument.mockResolvedValue({ id: 'd-1' });

      const result = await controller.uploadDocument('proj-1', body, file);

      expect(service.uploadDocument).toHaveBeenCalledWith('proj-1', file, body);
      expect(result).toEqual({ id: 'd-1' });
    });
  });

  describe('getDocumentFile', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return 404 when document is not found', async () => {
      service.getDocument.mockResolvedValue(null);
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.getDocumentFile('d-missing', res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('File not found');
    });

    it('should stream file from blob when found', async () => {
      service.getDocument.mockResolvedValue({
        id: 'd-1',
        fileUrl: 'https://blob.url/file.pdf',
        fileType: 'application/pdf',
        fileSize: 2048,
      });

      const mockArrayBuffer = new ArrayBuffer(8);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      } as any);

      const res = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.getDocumentFile('d-1', res);

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
      });
      expect(res.set).toHaveBeenCalledWith('Content-Length', 2048);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle blob storage error status', async () => {
      service.getDocument.mockResolvedValue({
        id: 'd-1',
        fileUrl: 'https://blob.url/file.pdf',
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as any);

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.getDocumentFile('d-1', res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith(
        'Failed to fetch file from blob storage',
      );
    });

    it('should handle exception during fetch with 500 status', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      service.getDocument.mockResolvedValue({
        id: 'd-1',
        fileUrl: 'https://blob.url/file.pdf',
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.getDocumentFile('d-1', res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
      consoleSpy.mockRestore();
    });
  });

  describe('deleteDocument', () => {
    it('should call documentsService.deleteDocument', async () => {
      service.deleteDocument.mockResolvedValue({ id: 'd-1' });

      const result = await controller.deleteDocument('d-1');

      expect(service.deleteDocument).toHaveBeenCalledWith('d-1');
      expect(result).toEqual({ id: 'd-1' });
    });
  });
});
