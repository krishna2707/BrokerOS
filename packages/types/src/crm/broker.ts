// ============================================================================
// BrokerOS — Shared Channel Partner & Brokerage Domain Types
// ============================================================================

import type { UserSummaryDto } from './roles.js';

export type BrokerStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLACKLISTED'
  | 'NEW'
  | 'CONTACTED'
  | 'VISIT'
  | 'DEAL';

export type BrokerageStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PAID'
  | 'DISPUTED'
  | 'HELD';

export type InboundCommissionStatus = 'PENDING' | 'RECEIVED';

export interface BrokerDto {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  firmName?: string | null;
  companyName?: string | null;
  brokerCode?: string | null;
  reraNumber?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
  city?: string | null;
  serviceAreas?: string | string[] | null;
  status: BrokerStatus;
  subStatus?: string | null;
  sourcingManagerId?: string | null;
  sourcingManager?: UserSummaryDto | null;
  totalDeals?: number;
  totalCommissionPaid?: number | string;
  pendingCommission?: number | string;
  assignedProjects?: any[];
  projectAssignments?: ProjectAssignmentDto[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectAssignmentDto {
  id: string;
  projectId: string;
  project?: { id: string; name: string } | null;
  brokerId?: string | null;
  brokeragePercent?: number | string | null;
  brokerageFlat?: number | string | null;
  isLocked?: boolean;
}

export interface BrokerMeetingDto {
  id: string;
  brokerId: string;
  broker?: BrokerDto | null;
  userId: string;
  user?: UserSummaryDto | null;
  scheduledAt: string | Date;
  location?: string | null;
  notes?: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string | Date;
}

export interface BrokerageRecordDto {
  id: string;
  bookingId: string;
  brokerId: string;
  broker?: BrokerDto | null;
  commissionPercentage: number | string;
  commissionAmount: number | string;
  status: BrokerageStatus;
  approvedById?: string | null;
  approvedBy?: UserSummaryDto | null;
  settlementId?: string | null;
  createdAt: string | Date;
}

export interface BrokerageSettlementDto {
  id: string;
  brokerId: string;
  broker?: BrokerDto | null;
  settlementNumber: string;
  totalAmount: number | string;
  paymentMode?: string | null;
  paymentRef?: string | null;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  approvedById?: string | null;
  approvedBy?: UserSummaryDto | null;
  processedById?: string | null;
  processedBy?: UserSummaryDto | null;
  processedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface InboundCommissionDto {
  id: string;
  bookingId: string;
  projectId: string;
  expectedAmount: number | string;
  receivedAmount?: number | string | null;
  status: InboundCommissionStatus;
  receivedDate?: string | Date | null;
  invoiceNumber?: string | null;
  createdAt: string | Date;
}
