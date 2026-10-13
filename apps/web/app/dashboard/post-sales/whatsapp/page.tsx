"use client";

import React from "react";
import { DepartmentWhatsAppPageClient } from "@/features/marketing/whatsapp";

export default function PostSalesWhatsAppPage() {
  return (
    <DepartmentWhatsAppPageClient
      title="Post-Sales WhatsApp Inbox"
      subtitle="Direct 1-on-1 customer WhatsApp communications for onboarding, documentation, milestones, and handovers."
      department="POST_SALES"
      scope="my"
    />
  );
}
