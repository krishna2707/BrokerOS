"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function SalesExecutiveSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Sales Executive SMS Inbox"
      subtitle="Direct SMS messaging with your site visit buyers, pricing discussions, and hot deals."
      department="SALES"
      scope="my"
    />
  );
}
