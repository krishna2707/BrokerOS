// ============================================================================
// BrokerOS — Shared Role, Department & Identity Types
// ============================================================================

export type RoleCode =
  | 'PRE_SALES'
  | 'PRE_SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'SALES_MANAGER'
  | 'POST_SALES_MANAGER'
  | 'POST_SALES'
  | 'FINANCE'
  | 'BUSINESS_MANAGER'
  | 'DIRECTOR'
  | 'ADMIN'
  | 'MARKETING'
  | 'SOURCING_MANAGER'
  | 'CLOSING_MANAGER'
  | 'CHANNEL_PARTNER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface RoleDto {
  id: string;
  name: string;
  code: RoleCode;
  description?: string | null;
  departmentId?: string | null;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface UserSummaryDto {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phoneNumber: string | null;
  employeeCode?: string | null;
  status: UserStatus;
  roleId?: string | null;
  role?: RoleDto | null;
  roleCode?: RoleCode | null;
  departmentId?: string | null;
  department?: DepartmentDto | null;
  image?: string | null;
  isOnCall?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
