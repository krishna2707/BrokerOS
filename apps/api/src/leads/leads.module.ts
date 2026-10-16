import { Module } from '@nestjs/common';
import { LeadsService } from './core/leads.service.js';
import { LeadsController } from './core/leads.controller.js';
import { PrismaModule } from '../lib/database/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

import { BookingsModule } from '../bookings/bookings.module.js';
import { CallRecordsModule } from './call-records/call-records.module.js';
import { FollowUpsModule } from './follow-ups/follow-ups.module.js';
import { NotesModule } from './notes/notes.module.js';
import { SiteVisitsModule } from './site-visits/site-visits.module.js';
import { NegotiationsModule } from './negotiations/negotiations.module.js';

import { BookingController } from './lead-booking.controller.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BookingsModule,
    CallRecordsModule,
    FollowUpsModule,
    NotesModule,
    SiteVisitsModule,
    NegotiationsModule,
  ],
  controllers: [LeadsController, BookingController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
