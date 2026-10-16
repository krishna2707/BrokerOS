// ============================================================================
// BrokerOS — Channel Partner & Brokerage Status Constants
// ============================================================================

export const BROKER_STATUS_CONFIG = {
  NEW: {
    label: 'New Partner',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  CONTACTED: {
    label: 'Contacted',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  VISIT: {
    label: 'Meeting Done',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  },
  DEAL: {
    label: 'Deal Active',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  PENDING_APPROVAL: {
    label: 'Approval Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  ACTIVE: {
    label: 'Active Network Partner',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  INACTIVE: {
    label: 'Inactive',
    badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  },
  BLACKLISTED: {
    label: 'Blacklisted',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
  },
} as const;

export const BROKERAGE_STATUS_CONFIG = {
  PENDING: {
    label: 'Claim Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  APPROVED: {
    label: 'Approved by Post-Sales',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  PAID: {
    label: 'Commission Disbursed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  DISPUTED: {
    label: 'Claim Disputed',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  },
  HELD: {
    label: 'Settlement on Hold',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400',
  },
} as const;

export const INBOUND_COMMISSION_STATUS_CONFIG = {
  PENDING: {
    label: 'Builder Invoice Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  RECEIVED: {
    label: 'Received from Builder',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
} as const;
