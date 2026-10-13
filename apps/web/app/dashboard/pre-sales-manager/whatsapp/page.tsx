"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function PreSalesManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Pre-Sales Manager WhatsApp Oversight"
      subtitle="Monitor all team conversations, filter by pre-sales executive, and track response velocity."
      department="PRE_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
