"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function BusinessManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Business Manager WhatsApp Intelligence"
      subtitle="Complete organizational WhatsApp visibility across pre-sales, sales, post-sales, and channel partners."
      department="BUSINESS_MANAGER"
      scope="all"
      showManagerFilter={true}
    />
  );
}
