// ============================================================================
// BrokerOS — Approvals, Negotiations & Site Visit Status Constants
// ============================================================================

export const APPROVAL_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    hex: '#f59e0b',
  },
  APPROVED: {
    label: 'Approved',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    hex: '#10b981',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
    hex: '#f43f5e',
  },
  ESCALATED: {
    label: 'Escalated to Director',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
    hex: '#a855f7',
  },
} as const;

export const APPROVAL_REQUEST_STATUS_CONFIG = {
  REQUESTED: {
    label: 'Requested',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
    hex: '#f59e0b',
  },
  APPROVED: {
    label: 'Approved',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    hex: '#10b981',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
    hex: '#f43f5e',
  },
  CLOSED: {
    label: 'Closed',
    badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
    hex: '#6b7280',
  },
} as const;

export const APPROVAL_TYPE_CONFIG = {
  DISCOUNT: { label: 'Price Discount' },
  SPECIAL_PRICING: { label: 'Special Pricing Request' },
  BROKERAGE_SETTLEMENT: { label: 'Brokerage Settlement' },
  EXPENSE: { label: 'Office / Travel Expense' },
  REFUND: { label: 'Client Refund' },
  BOOKING_CANCELLATION: { label: 'Booking Cancellation' },
  BOOKING: { label: 'Special Booking Confirmation' },
} as const;

export const SITE_VISIT_STATUS_CONFIG = {
  ASSIGNED: {
    label: 'Assigned to Exec',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  SCHEDULED: {
    label: 'Visit Scheduled',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  CONFIRMED: {
    label: 'Client Confirmed',
    badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  },
  IN_PROGRESS: {
    label: 'Visit Underway',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  COMPLETED: {
    label: 'Visit Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  CANCELLED: {
    label: 'Visit Cancelled',
    badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
  },
  NO_SHOW: {
    label: 'No Show',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  },
} as const;

export const NEGOTIATION_STATUS_CONFIG = {
  OPEN: {
    label: 'Open Discussion',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  COUNTER_OFFERED: {
    label: 'Counter Offer Sent',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
  MANAGER_REVIEW: {
    label: 'Manager Review Required',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  APPROVED: {
    label: 'Discount Approved',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  REJECTED: {
    label: 'Offer Declined',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  },
  CLOSED: {
    label: 'Negotiation Closed',
    badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  },
} as const;
