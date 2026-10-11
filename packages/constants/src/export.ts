// ============================================================================
// BrokerOS — Export Constants & Report Generators
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

export const LEAD_EXPORT_HEADERS = [
  { key: 'id', label: 'Lead ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'status', label: 'Pipeline Stage' },
  { key: 'subStatus', label: 'Sub-Status' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'score', label: 'AI Score' },
  { key: 'assignedAgent', label: 'Assigned Agent' },
  { key: 'interestedProject', label: 'Project' },
  { key: 'lastContactDate', label: 'Last Contact' },
  { key: 'nextFollowUpDate', label: 'Next Follow-Up' },
  { key: 'siteVisitDate', label: 'Site Visit Date' },
  { key: 'siteVisitStatus', label: 'Site Visit Status' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'brokerName', label: 'Broker / CP Partner' },
] as const;

export const TIME_RANGE_LABELS: Record<string, string> = {
  weekly: 'Last 7 Days (Weekly)',
  monthly: 'Last 30 Days (Monthly)',
  yearly: 'Last 365 Days (Yearly)',
  'all-time': 'All Time (Historical)',
  '30d': 'Last 30 Days',
  '60d': 'Last 60 Days',
  '90d': 'Last 90 Days',
};

/**
 * RFC-4180 compliant CSV string formatter from lead objects
 */
export function formatLeadsToCsv(leads: any[]): string {
  const headers = LEAD_EXPORT_HEADERS.map((h) => h.label);

  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((lead: any) => {
    const fullName =
      lead.fullName ||
      `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
      'Unnamed Lead';

    const assignedAgent =
      typeof lead.assignedUser === 'object' && lead.assignedUser
        ? lead.assignedUser.name || lead.assignedUser.username || ''
        : lead.assignedAgent || '';

    const interestedProject =
      typeof lead.interestedProject === 'object' && lead.interestedProject
        ? lead.interestedProject.name || ''
        : lead.project || lead.interestedProject || '';

    const latestSiteVisit =
      Array.isArray(lead.siteVisits) && lead.siteVisits.length > 0
        ? lead.siteVisits[0]
        : null;

    const siteVisitDate = latestSiteVisit?.scheduledDate
      ? new Date(latestSiteVisit.scheduledDate).toISOString().split('T')[0]
      : lead.siteVisitDate || '';

    const siteVisitStatus = latestSiteVisit?.status || lead.siteVisitStatus || '';

    const brokerName =
      typeof lead.broker === 'object' && lead.broker
        ? lead.broker.name || lead.broker.agencyName || ''
        : lead.brokerName || '';

    const formatDateVal = (dateVal: any) => {
      if (!dateVal) return '';
      try {
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? String(dateVal) : d.toISOString().replace('T', ' ').substring(0, 16);
      } catch {
        return String(dateVal);
      }
    };

    const rowValues = [
      lead.id || '',
      fullName,
      lead.phone || '',
      lead.status || '',
      lead.subStatus || '',
      lead.temperature || '',
      lead.score !== undefined && lead.score !== null ? String(lead.score) : '',
      assignedAgent,
      interestedProject,
      formatDateVal(lead.lastContactDate),
      formatDateVal(lead.nextFollowUpDate),
      siteVisitDate,
      siteVisitStatus,
      formatDateVal(lead.createdAt),
      brokerName,
    ];

    return rowValues.map(escapeCsvCell).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Standalone responsive HTML report generator for department analytics
 */
export function generateAnalyticsHtmlReport(payload: AnalyticsReportPayload): string {
  const timeRangeLabel = TIME_RANGE_LABELS[payload.timeRange] || payload.timeRange;
  const generatedDate = payload.generatedAt || new Date().toLocaleString();

  const summaryCardsHtml = (payload.summaryCards || [])
    .map(
      (card: AnalyticsSummaryCard) => `
      <div class="kpi-card">
        <div class="kpi-label">${escapeHtml(card.label)}</div>
        <div class="kpi-value">${escapeHtml(String(card.value))}</div>
        ${card.subtitle ? `<div class="kpi-subtitle">${escapeHtml(card.subtitle)}</div>` : ''}
        ${card.change ? `<div class="kpi-badge">${escapeHtml(card.change)}</div>` : ''}
      </div>
    `,
    )
    .join('');

  const funnelStagesHtml = (payload.funnelStages || [])
    .map((stage: AnalyticsFunnelStage, _idx: number, arr: AnalyticsFunnelStage[]) => {
      const maxCount = Math.max(...arr.map((s: AnalyticsFunnelStage) => s.count || 1), 1);
      const widthPct = Math.max(Math.round(((stage.count || 0) / maxCount) * 100), 4);
      const color = stage.color || '#6366f1';
      return `
        <div class="funnel-row">
          <div class="funnel-meta">
            <span class="funnel-name">${escapeHtml(stage.name)}</span>
            <span class="funnel-count">${Number(stage.count).toLocaleString()}</span>
          </div>
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width: ${widthPct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    })
    .join('');

  const detailedSectionsHtml = (payload.detailedSections || [])
    .map(
      (sec: AnalyticsReportSection) => `
      <div class="section-card">
        <h3 class="section-title">${escapeHtml(sec.title)}</h3>
        ${sec.description ? `<p class="section-desc">${escapeHtml(sec.description)}</p>` : ''}
        <div class="metrics-grid">
          ${sec.metrics
            .map(
              (m: AnalyticsMetricItem) => `
            <div class="metric-item">
              <span class="metric-label">${escapeHtml(m.label)}</span>
              <span class="metric-value">${escapeHtml(String(m.value))}</span>
              ${m.subtitle ? `<span class="metric-sub">${escapeHtml(m.subtitle)}</span>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `,
    )
    .join('');

  const activityMetricsHtml = (payload.activityMetrics || []).length
    ? `
    <div class="section-card">
      <h3 class="section-title">Activity & Telephonic Performance</h3>
      <div class="metrics-grid">
        ${payload.activityMetrics!
          .map(
            (m: AnalyticsMetricItem) => `
          <div class="metric-item">
            <span class="metric-label">${escapeHtml(m.label)}</span>
            <span class="metric-value">${escapeHtml(String(m.value))}</span>
            ${m.subtitle ? `<span class="metric-sub">${escapeHtml(m.subtitle)}</span>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `
    : '';

  const financialMetricsHtml = (payload.financialMetrics || []).length
    ? `
    <div class="section-card">
      <h3 class="section-title">Financial & Revenue Metrics</h3>
      <div class="metrics-grid">
        ${payload.financialMetrics!
          .map(
            (m: AnalyticsMetricItem) => `
          <div class="metric-item highlight">
            <span class="metric-label">${escapeHtml(m.label)}</span>
            <span class="metric-value">${escapeHtml(String(m.value))}</span>
            ${m.subtitle ? `<span class="metric-sub">${escapeHtml(m.subtitle)}</span>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(payload.departmentName)} Analytics — ${escapeHtml(timeRangeLabel)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f293d;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --brand: #6366f1;
      --brand-glow: rgba(99, 102, 241, 0.15);
      --accent: #38bdf8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px 20px;
      line-height: 1.5;
    }
    .report-container {
      max-width: 1040px;
      margin: 0 auto;
    }
    header.report-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
    }
    h1.dept-title {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .time-badge {
      display: inline-block;
      background: var(--brand-glow);
      border: 1px solid var(--brand);
      color: #c7d2fe;
      font-weight: 700;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 9999px;
    }
    .header-meta {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 24px;
      font-size: 12px;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .header-meta span strong {
      color: var(--text-main);
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease;
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .kpi-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .kpi-badge {
      align-self: flex-start;
      margin-top: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--success);
      color: #6ee7b7;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* Section Cards */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .section-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 18px;
    }

    /* Funnel Stages */
    .funnel-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 14px;
    }
    .funnel-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .funnel-meta {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
    }
    .funnel-name { color: #e2e8f0; }
    .funnel-count { color: #94a3b8; font-variant-numeric: tabular-nums; }
    .funnel-bar-bg {
      height: 10px;
      width: 100%;
      background: #1e293b;
      border-radius: 9999px;
      overflow: hidden;
    }
    .funnel-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }
    .metric-item {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .metric-item.highlight {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.05);
    }
    .metric-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .metric-value {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
    }
    .metric-sub {
      font-size: 11px;
      color: #64748b;
    }

    footer.report-footer {
      text-align: center;
      padding: 24px 0 12px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid var(--border);
      margin-top: 32px;
    }

    @media print {
      body {
        background: #ffffff;
        color: #0f172a;
        padding: 0;
      }
      header.report-header {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        box-shadow: none;
      }
      h1.dept-title, .kpi-value, .section-title, .metric-value {
        color: #0f172a !important;
      }
      .kpi-card, .section-card, .metric-item {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }
      .time-badge {
        background: #e0e7ff;
        color: #3730a3;
        border-color: #c7d2fe;
      }
      .funnel-bar-bg { background: #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <header class="report-header">
      <div class="header-top">
        <div>
          <div class="brand-title">BrokerOS Enterprise CRM</div>
          <h1 class="dept-title">${escapeHtml(payload.departmentName)}</h1>
        </div>
        <div class="time-badge">${escapeHtml(timeRangeLabel)}</div>
      </div>
      <div class="header-meta">
        <span>Generated: <strong>${escapeHtml(generatedDate)}</strong></span>
        ${payload.generatedBy ? `<span>User: <strong>${escapeHtml(payload.generatedBy)}</strong></span>` : ''}
        <span>Scope: <strong>${escapeHtml(payload.departmentCode)}</strong></span>
      </div>
    </header>

    <!-- Top KPI Grid -->
    <div class="kpi-grid">
      ${summaryCardsHtml}
    </div>

    <!-- Funnel Breakdown if present -->
    ${
      funnelStagesHtml
        ? `
      <div class="section-card">
        <h3 class="section-title">Pipeline & Conversion Funnel</h3>
        <p class="section-desc">Stage-by-stage lead progression through the pipeline.</p>
        <div class="funnel-container">
          ${funnelStagesHtml}
        </div>
      </div>
    `
        : ''
    }

    <!-- Financial Metrics if present -->
    ${financialMetricsHtml}

    <!-- Activity & Telephony Metrics if present -->
    ${activityMetricsHtml}

    <!-- Detailed Custom Sections -->
    ${detailedSectionsHtml}

    <footer class="report-footer">
      <p>BrokerOS Real Estate CRM &copy; ${new Date().getFullYear()} — Confidential & Proprietary Document</p>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
