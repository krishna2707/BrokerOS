// ============================================================================
// BrokerOS — Inventory & Unit Status Constants
// ============================================================================

export const UNIT_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    hex: '#10b981',
  },
  RESERVED: {
    label: 'Reserved',
    color: 'amber',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    hex: '#f59e0b',
  },
  BLOCKED: {
    label: 'Blocked',
    color: 'rose',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    hex: '#f43f5e',
  },
  SOLD: {
    label: 'Sold',
    color: 'slate',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    hex: '#64748b',
  },
} as const;

export const UNIT_TYPE_LABELS = {
  STUDIO: 'Studio Apartment',
  ONE_BHK: '1 BHK',
  TWO_BHK: '2 BHK',
  THREE_BHK: '3 BHK',
  FOUR_BHK: '4 BHK',
  PENTHOUSE: 'Penthouse',
  VILLA: 'Luxury Villa',
  SHOP: 'Commercial Shop',
  OFFICE: 'Commercial Office',
} as const;

export const PROJECT_STATUS_CONFIG = {
  UPCOMING: {
    label: 'Upcoming Project',
    color: 'blue',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  UNDER_CONSTRUCTION: {
    label: 'Under Construction',
    color: 'amber',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  },
  READY_TO_MOVE: {
    label: 'Ready to Move',
    color: 'emerald',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'slate',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400',
  },
} as const;
