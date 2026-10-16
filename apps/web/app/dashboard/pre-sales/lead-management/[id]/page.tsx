import { LeadProfileClient } from "@/features/leads";

export default async function PreSalesLeadProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <LeadProfileClient leadId={resolvedParams.id} />;
}
