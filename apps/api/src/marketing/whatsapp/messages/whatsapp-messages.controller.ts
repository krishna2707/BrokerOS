// ============================================================================
// BrokerOS — WhatsApp Messages Controller
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
} from '@nestjs/common';
import { WhatsAppMessagesService } from './whatsapp-messages.service.js';
import {
  SendWhatsAppMessageDto,
  SendMessageDirectDto,
  SendWhatsAppTemplateDirectDto,
  ListWhatsAppMessagesQueryDto,
  ScheduleWhatsAppMessageDto,
  RescheduleWhatsAppMessageDto,
  EditScheduledWhatsAppMessageDto,
} from '../dto/whatsapp.dto.js';

@Controller('api/marketing/whatsapp/messages')
export class WhatsAppMessagesController {
  constructor(private readonly messagesService: WhatsAppMessagesService) { }

  @Get(':conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: ListWhatsAppMessagesQueryDto,
  ) {
    return this.messagesService.getMessages(conversationId, query);
  }

  @Post('send')
  async sendMessageDirect(@Body() dto: SendMessageDirectDto, @Req() req: any) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.sendMessage(dto.conversationId, dto, sender);
  }

  @Post('send-template')
  async sendTemplateDirect(
    @Body() dto: SendWhatsAppTemplateDirectDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.sendTemplateDirect(dto, sender);
  }

  @Post('schedule')
  async scheduleMessageDirect(
    @Body() dto: ScheduleWhatsAppMessageDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.scheduleMessage(dto.conversationId!, dto, sender);
  }

  @Post(':conversationId')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendWhatsAppMessageDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.sendMessage(conversationId, dto, sender);
  }

  @Post(':conversationId/schedule')
  async scheduleMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: ScheduleWhatsAppMessageDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.scheduleMessage(conversationId, dto, sender);
  }

  @Get(':conversationId/scheduled')
  async getScheduledMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.getScheduledMessages(conversationId);
  }

  @Patch(':messageId/reschedule')
  async rescheduleMessage(
    @Param('messageId') messageId: string,
    @Body() dto: RescheduleWhatsAppMessageDto,
  ) {
    return this.messagesService.rescheduleMessage(messageId, dto.scheduledAt);
  }

  @Patch(':messageId/edit')
  async editScheduledMessage(
    @Param('messageId') messageId: string,
    @Body() dto: EditScheduledWhatsAppMessageDto,
  ) {
    return this.messagesService.editScheduledMessage(messageId, dto);
  }

  @Delete(':messageId/schedule')
  async cancelScheduledMessage(@Param('messageId') messageId: string) {
    return this.messagesService.cancelScheduledMessage(messageId);
  }

  @Post(':messageId/send-now')
  async sendScheduledMessageNow(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name }
      : undefined;
    return this.messagesService.sendScheduledMessageNow(messageId, sender);
  }
}

