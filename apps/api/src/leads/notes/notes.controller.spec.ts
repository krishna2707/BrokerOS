import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@brokeros/prisma', () => ({
  LeadStatus: { NEW: 'NEW', INTERESTED: 'INTERESTED' },
  PrismaClient: class {},
}));
jest.mock('../../lib/database/prisma.service.js', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
}));

import { NotesController } from './notes.controller.js';
import { NotesService } from './notes.service.js';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockNotesService = {
    getNotes: jest.fn(),
    createNote: jest.fn(),
    generateAiTransition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockNotesService }],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get notes for a lead', async () => {
    const expected = [{ id: 'n-1', content: 'Note 1' }];
    mockNotesService.getNotes.mockResolvedValue(expected);

    const res = await controller.getNotes('l-1');
    expect(service.getNotes).toHaveBeenCalledWith('l-1');
    expect(res).toEqual(expected);
  });

  it('should create note', async () => {
    const data = {
      content: 'Note content',
      userId: 'u-1',
      noteType: 'GENERAL',
      statusAtTimeOfNote: 'INTERESTED',
    };
    const expected = { id: 'n-1', ...data };
    mockNotesService.createNote.mockResolvedValue(expected);

    const res = await controller.createNote('l-1', data as any);
    expect(service.createNote).toHaveBeenCalledWith('l-1', data);
    expect(res).toEqual(expected);
  });

  it('should generate ai transition note', async () => {
    const expected = { success: true, noteId: 'n-ai-1' };
    mockNotesService.generateAiTransition.mockResolvedValue(expected);

    const res = await controller.generateAiTransition('l-1', { userId: 'u-1' });
    expect(service.generateAiTransition).toHaveBeenCalledWith('l-1', 'u-1');
    expect(res).toEqual(expected);
  });
});
