// ============================================================================
// BrokerOS — Master System Roles & Department Config
// ============================================================================

export const ROLES = [
  { name: 'Pre-sales', code: 'PRE_SALES', department: 'Brokerage' },
  { name: 'Pre-sales Manager', code: 'PRE_SALES_MANAGER', department: 'Brokerage' },
  { name: 'Sales Executive', code: 'SALES_EXECUTIVE', department: 'Brokerage' },
  { name: 'Sales Manager', code: 'SALES_MANAGER', department: 'Brokerage' },
  { name: 'Post-sales Manager', code: 'POST_SALES_MANAGER', department: 'Brokerage' },
  { name: 'Post-sales', code: 'POST_SALES', department: 'Brokerage' },
  { name: 'Finance', code: 'FINANCE', department: 'Operations' },
  { name: 'Business Manager', code: 'BUSINESS_MANAGER', department: 'Executive' },
  { name: 'Director', code: 'DIRECTOR', department: 'Executive' },
  { name: 'Admin', code: 'ADMIN', department: 'Administration' },
  { name: 'Marketing', code: 'MARKETING', department: 'Marketing' },
  { name: 'Sourcing Manager', code: 'SOURCING_MANAGER', department: 'Channel Partner' },
  { name: 'Closing Manager', code: 'CLOSING_MANAGER', department: 'Channel Partner' },
  { name: 'Channel Partner', code: 'CHANNEL_PARTNER', department: 'Channel Partner' },
] as const;

export const ROLE_CODES = [
  'PRE_SALES',
  'PRE_SALES_MANAGER',
  'SALES_EXECUTIVE',
  'SALES_MANAGER',
  'POST_SALES_MANAGER',
  'POST_SALES',
  'FINANCE',
  'BUSINESS_MANAGER',
  'DIRECTOR',
  'ADMIN',
  'MARKETING',
  'SOURCING_MANAGER',
  'CLOSING_MANAGER',
  'CHANNEL_PARTNER',
] as const;

export type SystemRoleCode = typeof ROLE_CODES[number];

export const ROLE_LABELS: Record<SystemRoleCode, string> = {
  PRE_SALES: 'Pre-sales Executive',
  PRE_SALES_MANAGER: 'Pre-sales Manager',
  SALES_EXECUTIVE: 'Sales Executive',
  SALES_MANAGER: 'Sales Manager',
  POST_SALES_MANAGER: 'Post-sales Manager',
  POST_SALES: 'Post-sales Executive',
  FINANCE: 'Finance & Accounts',
  BUSINESS_MANAGER: 'Business Manager',
  DIRECTOR: 'Director',
  ADMIN: 'System Admin',
  MARKETING: 'Marketing Specialist',
  SOURCING_MANAGER: 'Sourcing Manager',
  CLOSING_MANAGER: 'Closing Manager',
  CHANNEL_PARTNER: 'Channel Partner',
};

// ── Department Boundaries ────────────────────────────────────

export const CP_ROLES: readonly SystemRoleCode[] = [
  'SOURCING_MANAGER',
  'CLOSING_MANAGER',
  'CHANNEL_PARTNER',
] as const;

export const BROKERAGE_ROLES: readonly SystemRoleCode[] = [
  'PRE_SALES',
  'PRE_SALES_MANAGER',
  'SALES_EXECUTIVE',
  'SALES_MANAGER',
  'POST_SALES_MANAGER',
  'POST_SALES',
] as const;

export const MANAGEMENT_ROLES: readonly SystemRoleCode[] = [
  'PRE_SALES_MANAGER',
  'SALES_MANAGER',
  'POST_SALES_MANAGER',
  'BUSINESS_MANAGER',
  'DIRECTOR',
  'ADMIN',
] as const;

export function isCpRole(roleCode?: string | null): boolean {
  if (!roleCode) return false;
  return CP_ROLES.includes(roleCode as SystemRoleCode);
}

export function isBrokerageRole(roleCode?: string | null): boolean {
  if (!roleCode) return false;
  return BROKERAGE_ROLES.includes(roleCode as SystemRoleCode);
}

export function isManagementRole(roleCode?: string | null): boolean {
  if (!roleCode) return false;
  return MANAGEMENT_ROLES.includes(roleCode as SystemRoleCode);
}

export function getRoleLabel(roleCode: string): string {
  return ROLE_LABELS[roleCode as SystemRoleCode] || roleCode;
}
