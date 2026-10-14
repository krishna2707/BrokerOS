"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function SourcingManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Sourcing Manager Email Inbox"
      subtitle="Direct Email communication with Channel Partner brokers, project inventory releases, and commission statements."
      department="SOURCING_MANAGER"
      scope="my"
    />
  );
}
