// ============================================================================
// BrokerOS — Shared Lead Domain Types & DTOs
// ============================================================================

import type { UserSummaryDto } from './roles.js';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'QUALIFIED'
  | 'SITE_VISIT_SCHEDULED'
  | 'SITE_VISIT_COMPLETED'
  | 'NEGOTIATION'
  | 'BOOKING'
  | 'DOCUMENT'
  | 'LOAN'
  | 'AGREEMENT'
  | 'HANDOVER'
  | 'LOST';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type LeadSourceType =
  | 'FACEBOOK_ADS'
  | 'GOOGLE_ADS'
  | 'INSTAGRAM'
  | 'REFERRAL'
  | 'ORGANIC'
  | 'DIRECT_CALL'
  | 'WALK_IN'
  | 'CHANNEL_PARTNER'
  | 'WHATSAPP'
  | 'MARKETING_CAMPAIGN'
  | 'MARKETING_CSV_IMPORT'
  | 'OTHER';

export type DistributionMethod = 'ROUND_ROBIN' | 'MANUAL' | 'PROJECT_WISE';

export interface LeadSourceDto {
  id: string;
  name: string;
  type: LeadSourceType;
  isActive: boolean;
  cost?: number | string | null;
}

export interface LeadListItemDto {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  avatar?: string | null;
  status: LeadStatus;
  subStatus?: string | null;
  temperature?: LeadTemperature | null;
  score?: number | null;
  budget?: number | string | null;
  preferredConfig?: string | null;
  preferredLocation?: string | null;
  requirements?: string | null;
  interestedProjectId?: string | null;
  interestedProject?: {
    id: string;
    name: string;
    slug?: string;
    isCpProject?: boolean;
  } | null;
  project?: {
    id: string;
    name: string;
    slug?: string;
    isCpProject?: boolean;
  } | null;
  interestedTowerId?: string | null;
  interestedUnitId?: string | null;
  brokerId?: string | null;
  broker?: {
    id: string;
    name: string;
    firmName?: string | null;
    companyName?: string | null;
    phone?: string;
  } | null;
  assignedUserId?: string | null;
  assignedUser?: UserSummaryDto | null;
  salesExecutive?: UserSummaryDto | null;
  interestedTower?: { id: string; name: string } | null;
  interestedUnit?: { id: string; unitNumber: string } | null;
  sourceId?: string | null;
  source?: {
    id?: string;
    name: string;
    type?: string;
  } | null;
  siteVisitScheduledDate?: string | Date | null;
  siteVisitCompletedDate?: string | Date | null;
  latestSiteVisit?: any | null;
  processionStatus?: string | null;
  processionTimeline?: {
    value: number;
    unit: string;
  } | null;
  lastContactDate?: string | Date | null;
  nextFollowUpDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface LeadDto extends LeadListItemDto {
  customerSummary?: string | null;
  aiNextStepSuggestion?: string | null;
  createdById?: string | null;
  createdBy?: UserSummaryDto | null;
  deletedAt?: string | Date | null;
}

export interface NoteDto {
  id: string;
  leadId?: string;
  content: string;
  isImportant?: boolean;
  statusAtTimeOfNote?: string | null;
  authorId?: string;
  author?: UserSummaryDto | null;
  user?: {
    name?: string;
    username?: string;
    displayUsername?: string;
  } | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface FollowUpDto {
  id: string;
  leadId: string;
  scheduledAt?: string | Date;
  scheduledDate?: string | Date;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED' | 'CANCELLED' | string;
  type?: string;
  reminderTime?: string | Date | null;
  assignedToId?: string;
  assignedTo?: UserSummaryDto | null;
  remarks?: string | null;
  createdAt?: string | Date;
}

export interface CallRecordDto {
  id: string;
  leadId?: string | null;
  userId: string;
  user?: UserSummaryDto | null;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'CONNECTED' | 'NOT_ANSWERED' | 'BUSY' | 'FAILED' | 'VOICEMAIL';
  durationSeconds?: number | null;
  recordingUrl?: string | null;
  transcript?: string | null;
  summary?: string | null;
  startedAt: string | Date;
  endedAt?: string | Date | null;
}

export interface ActivityTimelineDto {
  id: string;
  leadId?: string | null;
  userId?: string | null;
  user?: UserSummaryDto | null;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string | Date;
}

export interface LeadDetailsDto extends LeadDto {
  notes?: NoteDto[];
  followUps?: FollowUpDto[];
  callRecords?: CallRecordDto[];
  activities?: ActivityTimelineDto[];
  assignmentHistory?: Array<{
    id: string;
    leadId: string;
    fromUserId?: string | null;
    fromUser?: UserSummaryDto | null;
    toUserId: string;
    toUser?: UserSummaryDto | null;
    reason?: string | null;
    assignedAt: string | Date;
  }>;
}
