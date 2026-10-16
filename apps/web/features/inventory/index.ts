// ============================================================================
// BrokerOS — Inventory Feature Module Barrel
// ============================================================================

// Project & Dashboard Components
export { SharedInventoryDashboard } from './components/project/SharedInventoryDashboard';
export { SharedProjectInventoryPage } from './components/project/SharedProjectInventoryPage';
export { InventoryFilters } from './components/project/InventoryFilters';
export { InventoryHeader } from './components/project/InventoryHeader';
export { ProjectDocuments } from './components/project/ProjectDocuments';

// Unit Components
export { UnitGrid } from './components/units/UnitGrid';
export { UnitDetailsDrawer } from './components/units/UnitDetailsDrawer';
export { UnitDetailsView } from './components/units/UnitDetailsView';
export { UnitBookingInfo } from './components/units/UnitBookingInfo';

// Wizards
export { AiTowerGenerator } from './components/wizards/AiTowerGenerator';
export { ManualTowerWizard } from './components/wizards/ManualTowerWizard';

// Hooks
export { useUnitDetails } from './hooks/useUnitDetails';
