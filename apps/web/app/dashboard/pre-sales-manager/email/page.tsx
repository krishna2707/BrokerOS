"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function PreSalesManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Pre-Sales Manager Email Oversight"
      subtitle="Monitor all team Email threads, filter by pre-sales executive, and track response velocity."
      department="PRE_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
