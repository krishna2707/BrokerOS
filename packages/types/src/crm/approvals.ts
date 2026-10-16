// ============================================================================
// BrokerOS — Shared Approvals, Site Visits & Negotiation Types
// ============================================================================

import type { UserSummaryDto } from './roles.js';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

export type ApprovalType =
  | 'DISCOUNT'
  | 'SPECIAL_PRICING'
  | 'BROKERAGE_SETTLEMENT'
  | 'EXPENSE'
  | 'REFUND'
  | 'BOOKING_CANCELLATION'
  | 'BOOKING';

export type ApprovalRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface ApprovalMessageDto {
  id: string;
  requestId: string;
  senderId: string;
  sender?: UserSummaryDto | null;
  message?: string;
  description?: string;
  fileUrl?: string | null;
  metadata?: {
    documents?: Array<{ name: string; url: string }>;
    [key: string]: any;
  } | null;
  createdAt: string | Date;
}

export interface ApprovalRequestDto {
  id: string;
  title: string;
  type: ApprovalType;
  status: ApprovalRequestStatus;
  leadId?: string | null;
  lead?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
  } | null;
  bookingId?: string | null;
  requestedById: string;
  requestedBy?: UserSummaryDto | null;
  salesExec?: UserSummaryDto | null;
  managerId?: string | null;
  manager?: UserSummaryDto | null;
  discountAmount?: number | string | null;
  discountPercent?: number | string | null;
  currentPrice?: number | string | null;
  offeredPrice?: number | string | null;
  reason?: string | null;
  managerNotes?: string | null;
  messages?: ApprovalMessageDto[];
  redoCount?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export type SiteVisitStatus =
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export interface SiteVisitDto {
  id: string;
  leadId: string;
  lead?: {
    id: string;
    firstName: string;
    lastName?: string | null;
    phone: string;
  } | null;
  projectId?: string;
  project?: {
    id?: string;
    name: string;
  } | null;
  salesExecId?: string | null;
  salesExec?: UserSummaryDto | null;
  createdById?: string | null;
  scheduledAt?: string | Date;
  scheduledDate?: string | Date;
  completedAt?: string | Date | null;
  destinationUrl?: string | null;
  meetingNotes?: string | null;
  arrivedAt?: string | Date | null;
  arriveLatitude?: number | null;
  arriveLongitude?: number | null;
  status: SiteVisitStatus | string;
  feedback?: string | null;
  customerInterestLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_INTERESTED' | null;
  cabRequired?: boolean;
  cabStatus?: string | null;
  verification?: {
    selfieUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    verifiedAt?: string | Date | null;
  } | null;
  createdAt?: string | Date;
}

export type NegotiationStatus =
  | 'OPEN'
  | 'COUNTER_OFFERED'
  | 'MANAGER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface NegotiationDto {
  id: string;
  leadId: string;
  salesExecId: string;
  unitId?: string | null;
  originalPrice: number | string;
  offeredPrice: number | string;
  discountPercentage?: number | string | null;
  status: NegotiationStatus;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}
