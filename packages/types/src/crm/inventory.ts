// ============================================================================
// BrokerOS — Shared Project & Inventory Domain Types
// ============================================================================

export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'BLOCKED' | 'SOLD';

export type UnitType =
  | 'STUDIO'
  | 'ONE_BHK'
  | 'TWO_BHK'
  | 'THREE_BHK'
  | 'FOUR_BHK'
  | 'PENTHOUSE'
  | 'VILLA'
  | 'SHOP'
  | 'OFFICE';

export type ProjectStatus =
  | 'UPCOMING'
  | 'UNDER_CONSTRUCTION'
  | 'READY_TO_MOVE'
  | 'COMPLETED';

export type ConstructionStatus =
  | 'NOT_STARTED'
  | 'EXCAVATION'
  | 'FOUNDATION'
  | 'SUPER_STRUCTURE'
  | 'BRICKWORK'
  | 'PLASTERING'
  | 'FINISHING'
  | 'READY_FOR_POSSESSION'
  | 'HANDOVER';

export type ProjectType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED';

export interface UnitDto {
  id: string;
  floorId: string;
  unitNumber: string;
  type: UnitType;
  status: UnitStatus;
  carpetArea?: number | string | null;
  builtUpArea?: number | string | null;
  superBuiltUpArea?: number | string | null;
  basePrice?: number | string | null;
  premiumAmount?: number | string | null;
  totalPrice?: number | string | null;
  facing?: string | null;
  floorPlanUrl?: string | null;
  isCornerUnit?: boolean;
  blockedById?: string | null;
  reservedForId?: string | null;
  floor?: {
    id: string;
    floorNumber: number;
    name?: string | null;
    tower?: {
      id: string;
      name: string;
      projectId: string;
      project?: {
        id: string;
        name: string;
        slug: string;
        isCpProject: boolean;
      };
    };
  };
  commissionPercentage?: number | string | null;
  commissionAmount?: number | string | null;
  bookings?: any[];
  processionStatus?: string | null;
  processionTimelineUnit?: string | null;
  processionTimelineValue?: number | null;
  constructionStatus?: ConstructionStatus | string | null;
  possessionTimeline?: { value: number; unit: string } | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface FloorDto {
  id: string;
  towerId: string;
  floorNumber: number;
  name?: string | null;
  totalUnits: number;
  units?: UnitDto[];
}

export interface TowerDto {
  id: string;
  projectId: string;
  name: string;
  totalFloors: number;
  totalUnits: number;
  constructionStatus?: ConstructionStatus;
  floors?: FloorDto[];
}

export interface ProjectDto {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: ProjectStatus;
  type: ProjectType;
  isCpProject: boolean;
  coverImage?: string | null;
  brochureUrl?: string | null;
  totalTowers?: number;
  totalUnits?: number;
  availableUnits?: number;
  bookedUnits?: number;
  soldUnits?: number;
  blockedUnits?: number;
  towers?: TowerDto[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
