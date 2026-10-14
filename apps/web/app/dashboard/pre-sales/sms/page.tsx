"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function PreSalesSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Pre-Sales SMS Inbox"
      subtitle="Direct 1-on-1 SMS messaging with your assigned discovery leads."
      department="PRE_SALES"
      scope="my"
    />
  );
}
