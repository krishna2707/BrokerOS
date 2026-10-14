"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function PreSalesManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Pre-Sales Manager SMS Oversight"
      subtitle="Monitor all team SMS conversations, filter by pre-sales executive, and track response velocity."
      department="PRE_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
