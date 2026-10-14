"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function BusinessManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Business Manager Email Intelligence"
      subtitle="Cross-departmental oversight of all enterprise Email messaging, quotation speeds, and client negotiations."
      department="BUSINESS_MANAGER"
      scope="all"
      showManagerFilter={true}
    />
  );
}
