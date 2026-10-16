"use client";

// ============================================================================
// BrokerOS — Brokers Feature Module Barrel
// ============================================================================

// Profile Components
export { BrokerProfileClient } from './components/profile/BrokerProfileClient';
export { BrokerHeader } from './components/profile/BrokerHeader';
export { BrokerInformationCard } from './components/profile/BrokerInformationCard';
export { BrokerDealCard } from './components/profile/BrokerDealCard';

// Table & Modal Components
export { BrokerTableClient } from './components/tables/BrokerTableClient';
export { BrokerTable } from './components/tables/BrokerTable';
export { AddBrokerModal } from './components/tables/AddBrokerModal';
export { AssignBrokerModal } from './components/tables/AssignBrokerModal';

// Hooks
export { useBrokerDetails } from './hooks/useBrokerDetails';
export { useBrokerNotes } from './hooks/useBrokerNotes';
export { useBrokerSchedules } from './hooks/useBrokerSchedules';
export { useBrokerTable } from './components/tables/useBrokerTable';
