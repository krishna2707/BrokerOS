"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function DirectorWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Executive Director WhatsApp Oversight"
      subtitle="Executive bird's-eye view of enterprise-wide client engagements, deal negotiations, and customer sentiments."
      department="DIRECTOR"
      scope="all"
      showManagerFilter={true}
    />
  );
}
