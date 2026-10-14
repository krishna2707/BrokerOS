"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function DirectorSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Executive Director SMS Command"
      subtitle="High-level visibility into all customer and broker SMS conversations across every project in the portfolio."
      department="DIRECTOR"
      scope="all"
      showManagerFilter={true}
    />
  );
}
