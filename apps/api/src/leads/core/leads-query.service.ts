import { Injectable, Optional } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

/**
 * @deprecated Legacy wrapper preserved for backward compatibility.
 * All logic has been consolidated into the deep LeadsService.
 */
@Injectable()
export class LeadsQueryService extends LeadsService {
  constructor(
    prisma: PrismaService,
    @Optional() notificationsService?: NotificationsService,
  ) {
    super(prisma, notificationsService || ({} as any));
  }
}
