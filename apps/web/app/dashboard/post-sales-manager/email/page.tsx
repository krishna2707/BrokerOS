"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function PostSalesManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Post-Sales Manager Email Oversight"
      subtitle="Supervise all formal customer demand letters, builder receipts, and possession paperwork emails."
      department="POST_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
