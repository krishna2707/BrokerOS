"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function AdminSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="System Administrator SMS Hub"
      subtitle="Complete system-wide visibility of all active SMS conversations, carrier routing, and message delivery status."
      department="ADMIN"
      scope="all"
      showManagerFilter={true}
    />
  );
}
