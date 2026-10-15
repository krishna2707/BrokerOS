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

export const INVENTORY_EXPORT_HEADERS = [
  { key: 'projectName', label: 'Project' },
  { key: 'towerName', label: 'Tower' },
  { key: 'floorNumber', label: 'Floor' },
  { key: 'unitNumber', label: 'Unit Number' },
  { key: 'unitType', label: 'Unit Type' },
  { key: 'status', label: 'Status' },
  { key: 'carpetArea', label: 'Carpet Area (sq.ft)' },
  { key: 'builtUpArea', label: 'Built-Up Area (sq.ft)' },
  { key: 'superBuiltUpArea', label: 'Super Built-Up Area (sq.ft)' },
  { key: 'facing', label: 'Facing' },
  { key: 'balconies', label: 'Balconies' },
  { key: 'parkingIncluded', label: 'Parking Included' },
  { key: 'basePrice', label: 'Base Price' },
  { key: 'pricePerSqFt', label: 'Price / Sq.Ft' },
  { key: 'totalPrice', label: 'Total Price' },
  { key: 'constructionStatus', label: 'Construction Status' },
  { key: 'occupantName', label: 'Occupant / Buyer Name' },
  { key: 'customerPhone', label: 'Customer Phone' },
  { key: 'customerEmail', label: 'Customer Email' },
  { key: 'bookingNumber', label: 'Booking Number' },
  { key: 'agreedPrice', label: 'Agreed Price' },
  { key: 'actionDate', label: 'Booking / Action Date' },
  { key: 'salesAgent', label: 'Sales Executive / Agent' },
  { key: 'remarks', label: 'Remarks' },
] as const;

export const UNIT_TYPE_DISPLAY_NAMES: Record<string, string> = {
  STUDIO: 'Studio',
  ONE_BHK: '1 BHK',
  TWO_BHK: '2 BHK',
  THREE_BHK: '3 BHK',
  FOUR_BHK: '4 BHK',
  PENTHOUSE: 'Penthouse',
  VILLA: 'Villa',
  SHOP: 'Shop',
  OFFICE: 'Office',
};

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

const CONSTRUCTION_STATUS_DISPLAY_MAP: Record<string, string> = {
  READY_TO_MOVE: 'Ready to Move',
  UNDER_CONSTRUCTION: 'Under Construction',
  SUPER_STRUCTURE: 'Super Structure',
  READY_FOR_POSSESSION: 'Ready for Possession',
  COMPLETED: 'Completed',
  UPCOMING: 'Upcoming',
  NOT_STARTED: 'Not Started',
  EXCAVATION: 'Excavation',
  FOUNDATION: 'Foundation',
  BRICKWORK: 'Brickwork',
  PLASTERING: 'Plastering',
  FINISHING: 'Finishing',
  HANDOVER: 'Handover',
};

function formatConstructionStatus(status: any): string {
  if (!status) return 'Ready to Move';
  const str = String(status).trim();
  if (CONSTRUCTION_STATUS_DISPLAY_MAP[str]) {
    return CONSTRUCTION_STATUS_DISPLAY_MAP[str];
  }
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * RFC-4180 compliant CSV string formatter for Project and Tower Inventory
 */
export function formatInventoryToCsv(towers: any[], defaultProjectName = ''): string {
  const headers = INVENTORY_EXPORT_HEADERS.map((h) => h.label);

  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatDateVal = (dateVal: any): string => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? String(dateVal) : d.toISOString().split('T')[0];
    } catch {
      return String(dateVal);
    }
  };

  const rows: string[] = [];

  const processUnit = (
    unit: any,
    towerName: string,
    floorNum: any,
    projName: string,
    towerObj?: any,
  ) => {
    const rawType = unit.type || '';
    const unitTypeDisplay = UNIT_TYPE_DISPLAY_NAMES[rawType] || rawType.replace(/_/g, ' ');
    const status = unit.status || 'AVAILABLE';

    // 1. Pricing Calculations (Fallback totalPrice to basePrice, derive pricePerSqFt if null)
    const basePriceNum = unit.basePrice != null ? Number(unit.basePrice) : null;
    const totalPriceNum = unit.totalPrice != null ? Number(unit.totalPrice) : basePriceNum;
    const basePriceStr = basePriceNum != null ? String(basePriceNum) : '';
    const totalPriceStr = totalPriceNum != null ? String(totalPriceNum) : '';

    const areaNum = Number(unit.carpetArea || unit.builtUpArea || unit.superBuiltUpArea || 0);
    let pricePerSqFtStr = '';
    if (unit.pricePerSqFt != null && String(unit.pricePerSqFt).trim() !== '') {
      pricePerSqFtStr = String(unit.pricePerSqFt);
    } else if (totalPriceNum && areaNum > 0) {
      pricePerSqFtStr = String(Math.round(totalPriceNum / areaNum));
    } else if (basePriceNum && areaNum > 0) {
      pricePerSqFtStr = String(Math.round(basePriceNum / areaNum));
    }

    // 2. Construction Status Hierarchy
    const rawConstructionStatus =
      unit.constructionStatus ||
      towerObj?.constructionStatus ||
      unit.tower?.constructionStatus ||
      towerObj?.project?.constructionStatus ||
      towerObj?.project?.status ||
      unit.project?.constructionStatus ||
      unit.project?.status ||
      'READY_TO_MOVE';
    const constructionStatusDisplay = formatConstructionStatus(rawConstructionStatus);

    // 3. Occupant, Booking, Agent & Commercial Details
    let occupantName = '';
    let customerPhone = '';
    let customerEmail = '';
    let bookingNumber = '';
    let agreedPrice = '';
    let actionDate = '';
    let salesAgent = '';
    let remarks = unit.remarks || '';

    const booking =
      Array.isArray(unit.bookings) && unit.bookings.length > 0 ? unit.bookings[0] : null;

    if (booking) {
      bookingNumber = booking.bookingNumber || '';
      agreedPrice = booking.agreedPrice != null ? String(booking.agreedPrice) : totalPriceStr;
      actionDate = formatDateVal(
        booking.bookingDate || unit.soldAt || unit.reservedAt || booking.createdAt,
      );

      if (booking.customer) {
        occupantName = `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim();
        customerPhone = booking.customer.phone || '';
        customerEmail = booking.customer.email || '';
      }

      salesAgent =
        booking.salesExec?.name ||
        booking.salesExec?.username ||
        booking.closingManager?.name ||
        booking.closingManager?.username ||
        booking.assignedPostSales?.name ||
        booking.assignedPostSales?.username ||
        '';

      if (!remarks) {
        remarks =
          booking.remarks ||
          booking.cancelReason ||
          (booking.status ? `Booking: ${booking.status.replace(/_/g, ' ')}` : '');
      }
    }

    // Fallback occupant details from reservedFor
    if (!occupantName && unit.reservedFor) {
      occupantName = unit.reservedFor.name || unit.reservedFor.username || '';
      customerPhone = customerPhone || unit.reservedFor.phoneNumber || unit.reservedFor.phone || '';
      customerEmail = customerEmail || unit.reservedFor.email || '';
      salesAgent = salesAgent || unit.reservedFor.name || unit.reservedFor.username || '';
      actionDate = actionDate || formatDateVal(unit.reservedAt || unit.updatedAt);
      if (!remarks) remarks = 'Reserved by Sales Agent';
    }

    // Fallback occupant details from blockedBy
    if (!occupantName && unit.blockedBy) {
      occupantName = unit.blockedBy.name || unit.blockedBy.username || '';
      customerPhone = customerPhone || unit.blockedBy.phoneNumber || unit.blockedBy.phone || '';
      customerEmail = customerEmail || unit.blockedBy.email || '';
      salesAgent = salesAgent || unit.blockedBy.name || unit.blockedBy.username || '';
      actionDate = actionDate || formatDateVal(unit.blockedAt || unit.updatedAt);
      if (!remarks) remarks = 'Temporarily Blocked';
    }

    if (!actionDate && unit.soldAt) {
      actionDate = formatDateVal(unit.soldAt);
    }

    // Fallback sales agent from tower assignments if still unassigned
    if (!salesAgent && towerObj?.towerAssignments && Array.isArray(towerObj.towerAssignments)) {
      const seAssign = towerObj.towerAssignments.find(
        (ta: any) => ta.role === 'SALES_EXECUTIVE' && ta.user,
      );
      const cmAssign = towerObj.towerAssignments.find(
        (ta: any) => ta.role === 'CLOSING_MANAGER' && ta.user,
      );
      const smAssign = towerObj.towerAssignments.find(
        (ta: any) => ta.role === 'SOURCING_MANAGER' && ta.user,
      );
      const anyAssign = towerObj.towerAssignments.find((ta: any) => ta.user);
      const targetUser = seAssign?.user || cmAssign?.user || smAssign?.user || anyAssign?.user;
      if (targetUser) {
        salesAgent = targetUser.name || targetUser.username || '';
      }
    }

    // Defaults for available or non-booked inventory
    if (!agreedPrice) {
      agreedPrice = totalPriceStr || basePriceStr || '—';
    }

    if (!actionDate) {
      actionDate = formatDateVal(unit.updatedAt || unit.createdAt || new Date());
    }

    if (!salesAgent) {
      salesAgent = 'Unassigned';
    }

    if (!occupantName) {
      occupantName = status === 'AVAILABLE' ? '—' : 'Pending Allocation';
    }

    if (!customerPhone) {
      customerPhone = '—';
    }

    if (!customerEmail) {
      customerEmail = '—';
    }

    if (!bookingNumber) {
      bookingNumber = status === 'RESERVED' ? `RES-${unit.unitNumber}` : '—';
    }

    if (!remarks) {
      if (status === 'AVAILABLE') remarks = 'Available for Sale';
      else if (status === 'RESERVED') remarks = 'Unit Reserved';
      else if (status === 'BLOCKED') remarks = 'Unit Blocked';
      else if (status === 'SOLD') remarks = 'Unit Sold';
      else remarks = 'Active Inventory';
    }

    const rowValues = [
      projName || unit.projectName || '',
      towerName || unit.towerName || '',
      floorNum !== undefined && floorNum !== null ? String(floorNum) : '',
      unit.unitNumber || '',
      unitTypeDisplay,
      status,
      unit.carpetArea !== undefined && unit.carpetArea !== null ? String(unit.carpetArea) : '',
      unit.builtUpArea !== undefined && unit.builtUpArea !== null ? String(unit.builtUpArea) : '',
      unit.superBuiltUpArea !== undefined && unit.superBuiltUpArea !== null
        ? String(unit.superBuiltUpArea)
        : '',
      unit.facing || '',
      unit.balconies !== undefined && unit.balconies !== null ? String(unit.balconies) : '0',
      unit.parkingIncluded ? 'Yes' : 'No',
      basePriceStr,
      pricePerSqFtStr,
      totalPriceStr,
      constructionStatusDisplay,
      occupantName,
      customerPhone,
      customerEmail,
      bookingNumber,
      agreedPrice,
      actionDate,
      salesAgent,
      remarks,
    ];

    rows.push(rowValues.map(escapeCsvCell).join(','));
  };

  (towers || []).forEach((item: any) => {
    const projName = defaultProjectName || item.projectName || item.project?.name || '';
    const towerName = item.name || item.towerName || '';

    if (Array.isArray(item.floors) && item.floors.length > 0) {
      item.floors.forEach((floor: any) => {
        const floorNum = floor.floorNumber !== undefined ? floor.floorNumber : floor.name;
        if (Array.isArray(floor.units)) {
          floor.units.forEach((unit: any) => {
            processUnit(unit, towerName, floorNum, projName, item);
          });
        }
      });
    } else if (Array.isArray(item.units) && item.units.length > 0) {
      item.units.forEach((unit: any) => {
        const floorNum =
          unit.floor?.floorNumber !== undefined ? unit.floor.floorNumber : unit.floorNumber;
        processUnit(unit, towerName, floorNum, projName, item);
      });
    } else if (item.unitNumber) {
      processUnit(item, item.towerName || '', item.floorNumber, projName, item);
    }
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
    ${funnelStagesHtml
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
