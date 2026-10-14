"use client";

import React from "react";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function ClosingManagerEmailPage() {
  return (
    <DepartmentEmailPageClient
      title="Closing Manager Email Inbox"
      subtitle="Send formal discount letters, unit booking sheets, and closing documentation to buyers."
      department="CLOSING"
      scope="team"
      showManagerFilter={true}
    />
  );
}
