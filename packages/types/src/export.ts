// ============================================================================
// BrokerOS — Export Types (Leads, Customers, Analytics HTML Reports)
// ============================================================================

export interface ExportLeadRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  phone: string;
  status: string;
  subStatus?: string;
  temperature?: string;
  score?: number | string;
  assignedAgent?: string;
  interestedProject?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  siteVisitDate?: string;
  siteVisitStatus?: string;
  createdAt?: string;
  brokerName?: string;
  [key: string]: any;
}

export interface AnalyticsSummaryCard {
  label: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon?: string;
}

export interface AnalyticsFunnelStage {
  name: string;
  count: number;
  percentage?: number;
  color?: string;
}

export interface AnalyticsMetricItem {
  label: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
}

export interface AnalyticsReportSection {
  title: string;
  description?: string;
  metrics: AnalyticsMetricItem[];
}

export interface AnalyticsReportPayload {
  departmentName: string;
  departmentCode: string;
  timeRange: string;
  generatedAt: string;
  generatedBy?: string;
  summaryCards: AnalyticsSummaryCard[];
  funnelStages?: AnalyticsFunnelStage[];
  detailedSections?: AnalyticsReportSection[];
  activityMetrics?: AnalyticsMetricItem[];
  financialMetrics?: AnalyticsMetricItem[];
  notes?: string[];
}
