"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function BusinessManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Business Manager SMS Intelligence"
      subtitle="Cross-departmental oversight of all enterprise SMS messaging, deal velocities, and customer satisfaction."
      department="BUSINESS_MANAGER"
      scope="all"
      showManagerFilter={true}
    />
  );
}
