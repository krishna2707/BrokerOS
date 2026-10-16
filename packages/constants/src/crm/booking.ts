// ============================================================================
// BrokerOS — Booking & Post-Sales Status Constants
// ============================================================================

export const BOOKING_STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Booking Confirmed',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    hex: '#10b981',
  },
  DOCUMENTATION_PENDING: {
    label: 'Docs Pending',
    color: 'amber',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    hex: '#f59e0b',
  },
  PAYMENT_PENDING: {
    label: 'Payment Pending',
    color: 'orange',
    badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    hex: '#f97316',
  },
  LOAN_IN_PROGRESS: {
    label: 'Loan In Progress',
    color: 'blue',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    hex: '#3b82f6',
  },
  AGREEMENT_PENDING: {
    label: 'Agreement Pending',
    color: 'indigo',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    hex: '#6366f1',
  },
  AGREEMENT_COMPLETED: {
    label: 'Agreement Registered',
    color: 'teal',
    badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    hex: '#14b8a6',
  },
  POSSESSION_PENDING: {
    label: 'Possession Scheduled',
    color: 'purple',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    hex: '#a855f7',
  },
  HANDOVER_COMPLETED: {
    label: 'Keys Handed Over',
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700',
    hex: '#059669',
  },
  CANCELLED: {
    label: 'Booking Cancelled',
    color: 'rose',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    hex: '#f43f5e',
  },
} as const;

export const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    hex: '#f59e0b',
  },
  PARTIAL: {
    label: 'Partially Paid',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
    hex: '#3b82f6',
  },
  PAID: {
    label: 'Paid in Full',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    hex: '#10b981',
  },
  OVERDUE: {
    label: 'Payment Overdue',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
    hex: '#ef4444',
  },
} as const;

export const LOAN_STATUS_CONFIG = {
  NOT_APPLIED: { label: 'Not Applied', color: 'gray' },
  APPLIED: { label: 'Applied', color: 'blue' },
  DOCUMENTS_SUBMITTED: { label: 'Docs Submitted', color: 'indigo' },
  UNDER_REVIEW: { label: 'Bank Review', color: 'amber' },
  APPROVED: { label: 'Sanctioned', color: 'teal' },
  DISBURSED: { label: 'Disbursed', color: 'emerald' },
  REJECTED: { label: 'Declined', color: 'red' },
} as const;

export const DOCUMENT_VERIFICATION_CONFIG = {
  PENDING: { label: 'Verification Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  VERIFIED: { label: 'Verified', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', badge: 'bg-red-50 text-red-700 border-red-200' },
} as const;
