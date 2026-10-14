"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function SalesExecutiveEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Sales Executive Email Inbox"
      subtitle="Direct Email messaging with your site visit buyers, brochures, and price quotations."
      department="SALES"
      scope="my"
    />
  );
}
