"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { getInboxConfig } from "@/lib/inbox";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function UnifiedWhatsAppInboxPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const role = user?.role as string || "SALES_EXECUTIVE";
  const config = getInboxConfig(role, "whatsapp");

  return (
    <DepartmentWhatsAppPageClient
      title={config.title}
      subtitle={config.subtitle}
      department={config.department}
      scope={config.scope}
      showManagerFilter={config.showManagerFilter}
    />
  );
}
