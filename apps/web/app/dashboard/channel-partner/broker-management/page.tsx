import { BrokerTableClient } from '@/features/brokers';

export default function CPBrokerManagementPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <BrokerTableClient />
    </div>
  );
}
