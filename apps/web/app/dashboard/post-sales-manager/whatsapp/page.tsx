"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function PostSalesManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Post-Sales Manager WhatsApp Oversight"
      subtitle="Monitor all client post-booking journeys, query escalations, and team response metrics across executives."
      department="POST_SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
