// ============================================================================
// BrokerOS Mobile — Lead Profile Types
// ============================================================================

import type {
  LeadDetailsDto,
  SiteVisitDto,
  FollowUpDto,
  NoteDto,
  CallRecordDto,
  BookingDto,
} from '@brokeros/types';

export type LeadProfileData = LeadDetailsDto & {
  siteVisits?: SiteVisitDto[];
  customer?: {
    bookings?: Array<BookingDto & { unit?: { unitNumber: string } }>;
  };
  preferredLocation?: string;
  requirements?: string;
};

export type { SiteVisitDto, FollowUpDto, NoteDto, CallRecordDto, BookingDto };
