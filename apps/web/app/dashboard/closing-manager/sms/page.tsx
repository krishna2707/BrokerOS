"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function ClosingManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Closing Manager SMS Inbox"
      subtitle="Communicate directly with high-intent buyers, negotiate booking discounts, and close unit sales."
      department="CLOSING"
      scope="team"
      showManagerFilter={true}
    />
  );
}
