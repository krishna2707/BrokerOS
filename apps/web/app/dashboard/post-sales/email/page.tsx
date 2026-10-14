"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function PostSalesEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Post-Sales Email Inbox"
      subtitle="Direct Email correspondence with unit owners for formal demand notes, receipts, and possession schedules."
      department="POST_SALES"
      scope="my"
    />
  );
}
