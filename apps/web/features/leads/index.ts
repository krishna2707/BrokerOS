"use client";

// ============================================================================
// BrokerOS — Leads Feature Module Barrel
// ============================================================================

// Profile & Detail Components
export { LeadProfileClient } from './components/profile/LeadProfileClient';
export { LeadHeader } from './components/profile/LeadHeader';
export { LeadInformationCard } from './components/profile/LeadInformationCard';
export { LeadNotesTimeline } from './components/profile/LeadNotesTimeline';
export { LeadSchedulesCard } from './components/profile/LeadSchedulesCard';
export { PaymentHistoryCard } from './components/booking/PaymentHistoryCard';

// Table & List Components
export { LeadTableClient } from './components/tables/LeadTableClient';
export { SalesExecLeadTableClient } from './components/tables/SalesExecLeadTableClient';
export { ClosingManagerLeadTableClient } from './components/tables/ClosingManagerLeadTableClient';
export { ChannelPartnerLeadTableClient } from './components/tables/ChannelPartnerLeadTableClient';
export { PostSalesLeadTableClient } from './components/tables/PostSalesLeadTableClient';
export { ClosingManagerHandoverClient } from './components/tables/ClosingManagerHandoverClient';
export { NewLeadsTable } from './components/tables/NewLeadsTable';
export { ExportLeadsButton } from './components/ExportLeadsButton';

// Hooks
export { useLeadDetails } from './hooks/useLeadDetails';
export { useLeadBooking } from './hooks/useLeadBooking';
export { useLeadNegotiations } from './hooks/useLeadNegotiations';
export { useLeadNotes } from './hooks/useLeadNotes';
export { useBookingForm } from './hooks/useBookingForm';
export { usePostSalesLeads } from './hooks/usePostSalesLeads';
export { useSalesExecLeads } from './hooks/useSalesExecLeads';
