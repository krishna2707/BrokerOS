"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { getInboxConfig } from "@/lib/inbox";
import { DepartmentSmsPageClient } from "@/features/marketing/sms";

export default function UnifiedSmsInboxPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const role = user?.role as string || "SALES_EXECUTIVE";
  const config = getInboxConfig(role, "sms");

  return (
    <DepartmentSmsPageClient
      title={config.title}
      subtitle={config.subtitle}
      department={config.department}
      scope={config.scope}
      showManagerFilter={config.showManagerFilter}
    />
  );
}
