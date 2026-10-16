import { BrokerTableClient } from '@/features/brokers';

export default function CMBrokerManagementPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <BrokerTableClient />
    </div>
  );
}
