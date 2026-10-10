import { WhatsAppContactsController } from './whatsapp-contacts.controller.js';

describe('WhatsAppContactsController', () => {
  let controller: WhatsAppContactsController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listContacts: jest.fn(),
      createContact: jest.fn(),
      getContact: jest.fn(),
      updateContact: jest.fn(),
      deleteContact: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      linkToLead: jest.fn(),
      listTags: jest.fn(),
      createTag: jest.fn(),
      deleteTag: jest.fn(),
      listQuickReplies: jest.fn(),
      createQuickReply: jest.fn(),
      updateQuickReply: jest.fn(),
      deleteQuickReply: jest.fn(),
      listNotes: jest.fn(),
      createNote: jest.fn(),
      deleteNote: jest.fn(),
      listCustomFields: jest.fn(),
      createCustomField: jest.fn(),
      saveContactCustomValues: jest.fn(),
      bulkImportContacts: jest.fn(),
    };

    controller = new WhatsAppContactsController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listContacts', async () => {
    const query = { page: 1, limit: 10 };
    mockService.listContacts.mockResolvedValue({ items: [] });

    const res = await controller.listContacts(query);
    expect(mockService.listContacts).toHaveBeenCalledWith(query);
    expect(res).toEqual({ items: [] });
  });

  it('should call createContact', async () => {
    const dto = { phone: '+919876543210', name: 'Alice' };
    mockService.createContact.mockResolvedValue({ id: 'c-1' });

    const res = await controller.createContact(dto);
    expect(mockService.createContact).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'c-1' });
  });

  it('should call getContact', async () => {
    mockService.getContact.mockResolvedValue({ id: 'c-1' });

    const res = await controller.getContact('c-1');
    expect(mockService.getContact).toHaveBeenCalledWith('c-1');
    expect(res).toEqual({ id: 'c-1' });
  });

  it('should call updateContact', async () => {
    const dto = { name: 'Bob' };
    mockService.updateContact.mockResolvedValue({ id: 'c-1', name: 'Bob' });

    const res = await controller.updateContact('c-1', dto);
    expect(mockService.updateContact).toHaveBeenCalledWith('c-1', dto);
    expect(res).toEqual({ id: 'c-1', name: 'Bob' });
  });

  it('should call deleteContact', async () => {
    mockService.deleteContact.mockResolvedValue({ success: true });

    const res = await controller.deleteContact('c-1');
    expect(mockService.deleteContact).toHaveBeenCalledWith('c-1');
    expect(res).toEqual({ success: true });
  });

  it('should call addTag and removeTag', async () => {
    mockService.addTag.mockResolvedValue({ success: true });
    mockService.removeTag.mockResolvedValue({ success: true });

    await controller.addTag('c-1', 't-1');
    expect(mockService.addTag).toHaveBeenCalledWith('c-1', 't-1');

    await controller.removeTag('c-1', 't-1');
    expect(mockService.removeTag).toHaveBeenCalledWith('c-1', 't-1');
  });

  it('should call linkLead', async () => {
    mockService.linkToLead.mockResolvedValue({ id: 'c-1', leadId: 'lead-1' });

    const res = await controller.linkLead('c-1', 'lead-1');
    expect(mockService.linkToLead).toHaveBeenCalledWith('c-1', 'lead-1');
    expect(res).toEqual({ id: 'c-1', leadId: 'lead-1' });
  });

  it('should call tags methods', async () => {
    mockService.listTags.mockResolvedValue([]);
    mockService.createTag.mockResolvedValue({ id: 't-1' });
    mockService.deleteTag.mockResolvedValue({ success: true });

    await controller.listTags('acc-1');
    expect(mockService.listTags).toHaveBeenCalledWith('acc-1');

    await controller.createTag({ name: 'VIP' });
    expect(mockService.createTag).toHaveBeenCalledWith({ name: 'VIP' });

    await controller.deleteTag('t-1');
    expect(mockService.deleteTag).toHaveBeenCalledWith('t-1');
  });

  it('should call quick-replies methods', async () => {
    mockService.listQuickReplies.mockResolvedValue([]);
    mockService.createQuickReply.mockResolvedValue({ id: 'qr-1' });
    mockService.updateQuickReply.mockResolvedValue({ id: 'qr-1' });
    mockService.deleteQuickReply.mockResolvedValue({ success: true });

    await controller.listQuickReplies('acc-1');
    expect(mockService.listQuickReplies).toHaveBeenCalledWith('acc-1');

    await controller.createQuickReply({ shortcut: 'hi', content: 'Hello' });
    expect(mockService.createQuickReply).toHaveBeenCalled();

    await controller.updateQuickReply('qr-1', { content: 'Updated' });
    expect(mockService.updateQuickReply).toHaveBeenCalled();

    await controller.deleteQuickReply('qr-1');
    expect(mockService.deleteQuickReply).toHaveBeenCalledWith('qr-1');
  });

  it('should call contact notes methods', async () => {
    mockService.listNotes.mockResolvedValue([]);
    mockService.createNote.mockResolvedValue({ id: 'n-1' });
    mockService.deleteNote.mockResolvedValue({ success: true });

    await controller.listNotes('c-1');
    expect(mockService.listNotes).toHaveBeenCalledWith('c-1');

    await controller.createNote('c-1', 'Note content', { user: { id: 'u-1' } });
    expect(mockService.createNote).toHaveBeenCalledWith('c-1', 'Note content', 'u-1');

    await controller.deleteNote('n-1');
    expect(mockService.deleteNote).toHaveBeenCalledWith('n-1');
  });

  it('should call custom fields and bulk import methods', async () => {
    mockService.listCustomFields.mockResolvedValue([]);
    mockService.createCustomField.mockResolvedValue({ id: 'cf-1' });
    mockService.saveContactCustomValues.mockResolvedValue({ success: true });
    mockService.bulkImportContacts.mockResolvedValue({ imported: 2 });

    await controller.listCustomFields('acc-1');
    expect(mockService.listCustomFields).toHaveBeenCalledWith('acc-1');

    await controller.createCustomField({ name: 'Budget' });
    expect(mockService.createCustomField).toHaveBeenCalledWith({ name: 'Budget' });

    await controller.saveContactCustomValues('c-1', { 'cf-1': '2Cr' });
    expect(mockService.saveContactCustomValues).toHaveBeenCalledWith('c-1', { 'cf-1': '2Cr' });

    await controller.bulkImportContacts([{ phone: '+919876543210' }], 'acc-1');
    expect(mockService.bulkImportContacts).toHaveBeenCalledWith([{ phone: '+919876543210' }], 'acc-1');
  });
});
