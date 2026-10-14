"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function SalesManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Sales Manager SMS Oversight"
      subtitle="Monitor all sales team SMS interactions, site visit communications, and deal negotiations."
      department="SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
