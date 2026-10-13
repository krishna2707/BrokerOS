import { Module } from '@nestjs/common';
import { PrismaModule } from '../lib/database/prisma.module.js';
import { CallRecordsModule } from '../leads/call-records/call-records.module.js';
import { CrmTelephonyController } from './crm-telephony.controller.js';
import { CrmTelephonyWebhooksController } from './crm-telephony-webhooks.controller.js';
import { CrmTelephonyService } from './crm-telephony.service.js';

@Module({
  imports: [PrismaModule, CallRecordsModule],
  controllers: [CrmTelephonyController, CrmTelephonyWebhooksController],
  providers: [CrmTelephonyService],
  exports: [CrmTelephonyService],
})
export class CrmTelephonyModule {}
