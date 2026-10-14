"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function DirectorEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Executive Director Email Command"
      subtitle="High-level visibility into all customer and broker Email correspondence across every project in the portfolio."
      department="DIRECTOR"
      scope="all"
      showManagerFilter={true}
    />
  );
}
