"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function SalesManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Sales Manager Email Oversight"
      subtitle="Monitor all sales team Email threads, quotation deliveries, and negotiation correspondence."
      department="SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
