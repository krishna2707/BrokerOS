"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function FinanceEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Finance Email Records & Audits"
      subtitle="Enterprise audit access to all Email records concerning billing notices, tax invoices, and broker brokerage payouts."
      department="FINANCE"
      scope="all"
      showManagerFilter={true}
    />
  );
}
