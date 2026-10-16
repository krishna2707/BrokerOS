"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { getInboxConfig } from "@/lib/inbox";
import { DepartmentEmailPageClient } from "@/features/marketing/email";

export default function UnifiedEmailInboxPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const role = user?.role as string || "SALES_EXECUTIVE";
  const config = getInboxConfig(role, "email");

  return (
    <DepartmentEmailPageClient
      title={config.title}
      subtitle={config.subtitle}
      department={config.department}
      scope={config.scope}
      showManagerFilter={config.showManagerFilter}
    />
  );
}
