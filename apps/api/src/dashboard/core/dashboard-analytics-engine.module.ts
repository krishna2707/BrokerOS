import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/database/prisma.module.js';
import { DashboardAnalyticsEngineService } from './dashboard-analytics-engine.service.js';

@Module({
  imports: [PrismaModule],
  providers: [DashboardAnalyticsEngineService],
  exports: [DashboardAnalyticsEngineService],
})
export class DashboardAnalyticsEngineModule {}
