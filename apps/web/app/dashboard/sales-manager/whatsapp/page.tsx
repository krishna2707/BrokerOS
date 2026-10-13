"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function SalesManagerWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Sales Manager WhatsApp Oversight"
      subtitle="Monitor live on-site visit conversations, filter by sales executive, and step into closing negotiations."
      department="SALES"
      scope="team"
      showManagerFilter={true}
    />
  );
}
