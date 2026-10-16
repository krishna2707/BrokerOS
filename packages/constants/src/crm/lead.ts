// ============================================================================
// BrokerOS — Lead Status, Temperature & Source Constants
// ============================================================================

export const LEAD_STATUS_CONFIG = {
  NEW: {
    label: 'New Lead',
    color: 'blue',
    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    hex: '#3b82f6',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'indigo',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    hex: '#6366f1',
  },
  INTERESTED: {
    label: 'Interested',
    color: 'teal',
    bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    hex: '#14b8a6',
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'emerald',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    hex: '#10b981',
  },
  SITE_VISIT_SCHEDULED: {
    label: 'Visit Scheduled',
    color: 'purple',
    bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    hex: '#a855f7',
  },
  SITE_VISIT_COMPLETED: {
    label: 'Visit Done',
    color: 'violet',
    bg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    hex: '#8b5cf6',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    color: 'amber',
    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    hex: '#f59e0b',
  },
  BOOKING: {
    label: 'Booking Initiated',
    color: 'green',
    bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    hex: '#22c55e',
  },
  DOCUMENT: {
    label: 'Documentation',
    color: 'cyan',
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    hex: '#06b6d4',
  },
  LOAN: {
    label: 'Loan In Progress',
    color: 'orange',
    bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    hex: '#f97316',
  },
  AGREEMENT: {
    label: 'Agreement Stage',
    color: 'rose',
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    hex: '#f43f5e',
  },
  HANDOVER: {
    label: 'Handover / Possession',
    color: 'emerald',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700',
    hex: '#059669',
  },
  LOST: {
    label: 'Lost / Dropped',
    color: 'gray',
    bg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    hex: '#6b7280',
  },
} as const;

export const LEAD_TEMPERATURE_CONFIG = {
  HOT: {
    label: 'Hot',
    color: 'red',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    hex: '#ef4444',
  },
  WARM: {
    label: 'Warm',
    color: 'amber',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    hex: '#f59e0b',
  },
  COLD: {
    label: 'Cold',
    color: 'blue',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    hex: '#3b82f6',
  },
} as const;

export const LEAD_SOURCE_LABELS = {
  FACEBOOK_ADS: 'Meta Facebook Ads',
  GOOGLE_ADS: 'Google Search / Display Ads',
  INSTAGRAM: 'Instagram Campaign',
  REFERRAL: 'Client Referral',
  ORGANIC: 'Organic / Website Inbound',
  DIRECT_CALL: 'Direct Inbound Call',
  WALK_IN: 'Site Office Walk-in',
  CHANNEL_PARTNER: 'Channel Partner / Broker',
  WHATSAPP: 'WhatsApp Direct Chat',
  MARKETING_CAMPAIGN: 'Marketing Broadcast',
  MARKETING_CSV_IMPORT: 'CSV Audience Import',
  OTHER: 'Other Source',
} as const;
