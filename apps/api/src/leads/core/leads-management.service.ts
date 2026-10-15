import { Injectable } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

/**
 * @deprecated Legacy wrapper preserved for backward compatibility.
 * All logic has been consolidated into the deep LeadsService.
 */
@Injectable()
export class LeadsManagementService extends LeadsService {
  constructor(
    prisma: PrismaService,
    notificationsService: NotificationsService,
  ) {
    super(prisma, notificationsService);
  }
}
