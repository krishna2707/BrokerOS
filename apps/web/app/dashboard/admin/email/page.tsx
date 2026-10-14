"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function AdminEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="System Administrator Email Hub"
      subtitle="Complete system-wide visibility of all active Email conversations, provider routing, and delivery logs."
      department="ADMIN"
      scope="all"
      showManagerFilter={true}
    />
  );
}
