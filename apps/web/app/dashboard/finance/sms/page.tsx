"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function FinanceSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Finance SMS Records & Audits"
      subtitle="Enterprise audit access to all SMS communications concerning customer payments and broker commission settlements."
      department="FINANCE"
      scope="all"
      showManagerFilter={true}
    />
  );
}
