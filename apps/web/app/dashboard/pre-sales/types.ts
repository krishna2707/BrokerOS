// ============================================================================
// BrokerOS — Pre-Sales Workspace Dashboard Types
// ============================================================================

import type { PreSalesDashboardData, LeaderboardEntry } from '@brokeros/types';

export type DashboardData = PreSalesDashboardData;
export type { LeaderboardEntry };

export interface Announcement {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
