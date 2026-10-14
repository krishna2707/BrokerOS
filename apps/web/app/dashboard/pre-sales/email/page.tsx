"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function PreSalesEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Pre-Sales Email Inbox"
      subtitle="Direct 1-on-1 Email messaging with your assigned discovery leads."
      department="PRE_SALES"
      scope="my"
    />
  );
}
