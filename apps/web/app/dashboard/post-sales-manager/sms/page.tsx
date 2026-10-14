"use client";

import React from "react";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function PostSalesManagerSmsPage() {
  return (
    <DepartmentSmsPageClient
      title="Post-Sales Manager SMS Oversight"
      subtitle="Monitor all customer collection SMS threads, demand notices, and post-booking support cases."
      department="POST_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
