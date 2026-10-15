import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service.js';
import { getMonthRange } from '../core/dashboard.utils.js';
import { DashboardAnalyticsEngineService } from '../core/dashboard-analytics-engine.service.js';

@Injectable()
export class SalesExecLeaderboardService {
  constructor(
    private prisma: PrismaService,
    @Optional() private analyticsEngine?: DashboardAnalyticsEngineService,
  ) {}

  /** Monthly leaderboard for the whole sales executive department */
  async getSalesExecLeaderboard(userId: string) {
    if (this.analyticsEngine) {
      const ranked = await this.analyticsEngine.getOrCompute({
        dashboardType: 'SALES_EXEC',
        widgetKey: 'leaderboard',
        period: 'monthly',
        ttlSeconds: 300,
        compute: () => this.computeSalesExecLeaderboard(),
      });

      return {
        leaderboard: ranked,
        currentUserId: userId,
      };
    }

    const ranked = await this.computeSalesExecLeaderboard();
    return {
      leaderboard: ranked,
      currentUserId: userId,
    };
  }

  private async computeSalesExecLeaderboard() {
    const { start: monthStart, end: monthEnd } = getMonthRange();

    // Get all sales exec users
    const deptUsers = await this.prisma.user.findMany({
      where: {
        role: { code: 'SALES_EXECUTIVE' },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
        employeeCode: true,
      },
    });

    // For each user, calculate monthly metrics
    const leaderboardData = await Promise.all(
      deptUsers.map(async (agent) => {
        const [siteVisits, bookings] = await Promise.all([
          this.prisma.siteVisit.count({
            where: {
              salesExecId: agent.id,
              status: 'COMPLETED',
              completedAt: { gte: monthStart, lte: monthEnd },
            },
          }),
          this.prisma.booking.count({
            where: {
              salesExecId: agent.id,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          }),
        ]);

        // Weighted score: SV Completed * 40, Bookings * 60
        const score = siteVisits * 40 + bookings * 60;

        return {
          id: agent.id,
          name: agent.name,
          image: agent.image,
          employeeCode: agent.employeeCode,
          svCompleted: siteVisits,
          bookings,
          activeNegotiations: 0, // Placeholder
          score,
        };
      }),
    );

    // Sort by score descending, assign ranks
    leaderboardData.sort((a, b) => b.score - a.score);
    const ranked = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return ranked;
  }
}
