"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function SourcingManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Sourcing Manager SMS Inbox"
      subtitle="Direct 1-on-1 SMS messaging with your assigned Channel Partner brokers, inventory updates, and payout inquiries."
      department="SOURCING_MANAGER"
      scope="my"
    />
  );
}
