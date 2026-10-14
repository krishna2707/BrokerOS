// ============================================================================
// BrokerOS — SMS Inbox Controller (REST API for 2-Way SMS Team Inbox)
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
import { SmsInboxService } from '../services/sms-inbox.service.js';
import {
  ListSmsConversationsQueryDto,
  StartSmsConversationDto,
  SendSmsReplyDto,
  UpdateSmsConversationStatusDto,
  AssignSmsConversationAgentDto,
  ListSmsMessagesQueryDto,
  DraftSmsAiReplyDto,
  ScheduleSmsDto,
  RescheduleSmsDto,
  EditScheduledSmsDto,
} from '../dto/sms-inbox.dto.js';

@Controller('api/marketing/sms/inbox')
export class SmsInboxController {
  constructor(private readonly inboxService: SmsInboxService) {}

  @Get('conversations')
  async listConversations(
    @Query() query: ListSmsConversationsQueryDto,
    @Req() req: any,
  ) {
    return this.inboxService.listConversations(query, req?.user);
  }

  @Post('conversations')
  async startConversation(
    @Body() dto: StartSmsConversationDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name, email: req.user.email }
      : undefined;
    return this.inboxService.startConversation(dto, sender);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.inboxService.getConversation(id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query() query: ListSmsMessagesQueryDto,
  ) {
    return this.inboxService.getMessages(id, query);
  }

  @Post('conversations/:id/messages')
  async sendReply(
    @Param('id') id: string,
    @Body() dto: SendSmsReplyDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name, email: req.user.email }
      : undefined;
    return this.inboxService.sendReply(id, dto, sender);
  }

  @Post('conversations/:id/schedule')
  async scheduleMessage(
    @Param('id') id: string,
    @Body() dto: ScheduleSmsDto,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name, email: req.user.email }
      : undefined;
    return this.inboxService.scheduleMessage(id, dto, sender);
  }

  @Get('conversations/:id/scheduled')
  async getScheduledMessages(@Param('id') id: string) {
    return this.inboxService.getScheduledMessages(id);
  }

  @Patch('messages/:messageId/reschedule')
  async rescheduleMessage(
    @Param('messageId') messageId: string,
    @Body() dto: RescheduleSmsDto,
  ) {
    return this.inboxService.rescheduleMessage(messageId, dto.scheduledAt);
  }

  @Patch('messages/:messageId/edit')
  async editScheduledMessage(
    @Param('messageId') messageId: string,
    @Body() dto: EditScheduledSmsDto,
  ) {
    return this.inboxService.editScheduledMessage(messageId, dto);
  }

  @Delete('messages/:messageId/schedule')
  async cancelScheduledMessage(@Param('messageId') messageId: string) {
    return this.inboxService.cancelScheduledMessage(messageId);
  }

  @Post('messages/:messageId/send-now')
  async sendScheduledMessageNow(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ) {
    const sender = req?.user
      ? { id: req.user.id, name: req.user.name, email: req.user.email }
      : undefined;
    return this.inboxService.sendScheduledMessageNow(messageId, sender);
  }

  @Patch('conversations/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSmsConversationStatusDto,
  ) {
    return this.inboxService.updateStatus(id, dto.status);
  }

  @Patch('conversations/:id/assign')
  async assignAgent(
    @Param('id') id: string,
    @Body() dto: AssignSmsConversationAgentDto,
    @Req() req: any,
  ) {
    const agentId =
      dto.agentUserId !== undefined ? dto.agentUserId : req?.user?.id;
    return this.inboxService.assignAgent(id, agentId);
  }

  @Patch('conversations/:id/ai-toggle')
  async toggleAiAutoReply(
    @Param('id') id: string,
    @Body() body: { disabled: boolean },
  ) {
    return this.inboxService.toggleAiAutoReply(id, Boolean(body.disabled));
  }

  @Post('conversations/:id/read')
  async markRead(@Param('id') id: string) {
    return this.inboxService.markRead(id);
  }

  @Post('conversations/:id/ai-draft')
  async draftAiReply(
    @Param('id') id: string,
    @Body() dto?: DraftSmsAiReplyDto,
  ) {
    return this.inboxService.draftAiReply(id, dto);
  }
}

