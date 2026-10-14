"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function PostSalesSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Post-Sales SMS Inbox"
      subtitle="Direct SMS messaging with verified unit buyers for payment reminders, demand letters, and handover milestones."
      department="POST_SALES"
      scope="my"
    />
  );
}
