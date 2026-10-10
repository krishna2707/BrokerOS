import { Test, TestingModule } from '@nestjs/testing';
jest.mock('@brokeros/prisma', () => ({ PrismaClient: class {} }));
jest.mock('expo-server-sdk', () => ({ Expo: class {} }));
jest.mock('@vercel/blob', () => ({
  put: jest
    .fn()
    .mockResolvedValue({ url: 'https://blob.vercel.com/project/doc.pdf' }),
}));

import { DocumentsService } from './documents.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { UploadDocumentDto } from './dto/document.dto.js';
import { put } from '@vercel/blob';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    projectDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should throw error if file is missing', async () => {
      await expect(
        service.uploadDocument('p-1', null as any, {} as any),
      ).rejects.toThrow('File is required');
    });

    it('should upload to blob and create document record', async () => {
      mockPrisma.projectDocument.create.mockResolvedValue({
        id: 'doc-1',
        title: 'Floor Plan',
      });

      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'floorplan.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      };
      const dto = {
        title: 'Floor Plan',
        category: 'BROCHURE',
        towerId: 'tower-1',
        isPublic: true,
      } as UploadDocumentDto;

      const result = await service.uploadDocument('p-1', file, dto);

      expect(put).toHaveBeenCalledWith(
        'projects/p-1/BROCHURE-floorplan.pdf',
        file.buffer,
        expect.objectContaining({ access: 'public' }),
      );
      expect(mockPrisma.projectDocument.create).toHaveBeenCalledWith({
        data: {
          projectId: 'p-1',
          towerId: 'tower-1',
          title: 'Floor Plan',
          category: 'BROCHURE',
          fileUrl: 'https://blob.vercel.com/project/doc.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          isPublic: true,
        },
      });
      expect(result).toEqual({ id: 'doc-1', title: 'Floor Plan' });
    });
  });

  describe('getDocuments', () => {
    it('should fetch documents without towerId', async () => {
      mockPrisma.projectDocument.findMany.mockResolvedValue([{ id: 'doc-1' }]);

      const result = await service.getDocuments('p-1');

      expect(mockPrisma.projectDocument.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'doc-1' }]);
    });

    it('should fetch documents with towerId', async () => {
      mockPrisma.projectDocument.findMany.mockResolvedValue([{ id: 'doc-1' }]);

      const result = await service.getDocuments('p-1', 'tower-1');

      expect(mockPrisma.projectDocument.findMany).toHaveBeenCalledWith({
        where: { projectId: 'p-1', towerId: 'tower-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'doc-1' }]);
    });
  });

  describe('getDocument', () => {
    it('should fetch a document by id', async () => {
      mockPrisma.projectDocument.findUnique.mockResolvedValue({ id: 'doc-1' });

      const result = await service.getDocument('doc-1');

      expect(mockPrisma.projectDocument.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(result).toEqual({ id: 'doc-1' });
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document by id', async () => {
      mockPrisma.projectDocument.delete.mockResolvedValue({ id: 'doc-1' });

      const result = await service.deleteDocument('doc-1');

      expect(mockPrisma.projectDocument.delete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(result).toEqual({ id: 'doc-1' });
    });
  });
});
