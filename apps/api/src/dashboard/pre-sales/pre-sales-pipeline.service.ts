import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { getMonthRange } from '../core/dashboard.utils.js';
import { DashboardAnalyticsEngineService } from '../core/dashboard-analytics-engine.service.js';

@Injectable()
export class PreSalesPipelineService {
  constructor(
    private prisma: PrismaService,
    @Optional() private analyticsEngine?: DashboardAnalyticsEngineService,
  ) {}

  async getPipeline(userId: string) {
    if (this.analyticsEngine) {
      return this.analyticsEngine.getPreSalesPipeline(userId);
    }
    return this.computePipeline(userId);
  }

  async computePipeline(userId: string) {
    const { start: monthStart, end: monthEnd } = getMonthRange();

    const pipelineCounts = await this.prisma.lead.groupBy({
      by: ['status'],
      where: {
        assignedUserId: userId,
        createdAt: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
      _count: { status: true },
    });

    const pipelineStages = [
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'QUALIFIED',
      'SITE_VISIT_SCHEDULED',
      'SITE_VISIT_COMPLETED',
      'BOOKING',
      'LOST',
    ];

    const pipelineMap: Record<string, number> = {};
    pipelineStages.forEach((stage) => (pipelineMap[stage] = 0));
    pipelineCounts.forEach((p) => {
      pipelineMap[p.status] = p._count.status;
    });

    return pipelineMap;
  }
}
